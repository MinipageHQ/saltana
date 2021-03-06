const createError = require('http-errors')
const _ = require('lodash')
const bluebird = require('bluebird')

const { getObjectId } = require('@saltana/util-keys')
const { getModels } = require('../db')

const { logError } = require('../../server/logger')

const {
  setSaltanaTask,
  removeSaltanaTask,
  removeSaltanaTaskExecutionDates,
} = require('../redis')

const { performListQuery } = require('@saltana/utils').listQueryBuilder

const { isValidCronPattern, isValidTimezone, getRoundedDate } =
  require('@saltana/utils').time

let responder
let eventSubscriber

async function removeTask({ taskId, platformId, env }) {
  const { Task } = await getModels({ platformId, env })

  await Task.query().deleteById(taskId)

  await removeSaltanaTask({ platformId, env, taskId })
  await removeSaltanaTaskExecutionDates({ taskId })
}

function stop() {
  responder.close()
  responder = null

  eventSubscriber.close()
  eventSubscriber = null
}

function start({ communication }) {
  const { getResponder, getSubscriber, COMMUNICATION_ID } = communication

  responder = getResponder({
    name: 'Task Responder',
    key: 'task',
  })

  eventSubscriber = getSubscriber({
    name: 'Task subscriber for events',
    key: 'event',
    namespace: COMMUNICATION_ID,
    subscribesTo: ['eventCreated'],
  })

  responder.on('list', async (req) => {
    const { platformId } = req
    const { env } = req
    const { Task } = await getModels({ platformId, env })

    const {
      orderBy,
      order,

      nbResultsPerPage,

      // offset pagination
      page,

      // cursor pagination
      startingAfter,
      endingBefore,

      id,
      createdDate,
      updatedDate,
      eventType,
      eventObjectId,
      active,
    } = req

    const queryBuilder = Task.query()

    const paginationMeta = await performListQuery({
      queryBuilder,
      filters: {
        ids: {
          dbField: 'id',
          value: id,
          transformValue: 'array',
          query: 'inList',
        },
        createdDate: {
          dbField: 'createdDate',
          value: createdDate,
          query: 'range',
        },
        updatedDate: {
          dbField: 'updatedDate',
          value: updatedDate,
          query: 'range',
        },
        eventTypes: {
          dbField: 'eventType',
          value: eventType,
          transformValue: 'array',
          query: 'inList',
        },
        eventObjectIds: {
          dbField: 'eventObjectId',
          value: eventObjectId,
          transformValue: 'array',
          query: 'inList',
        },
        active: {
          dbField: 'active',
          value: active,
        },
      },
      paginationActive: true,
      paginationConfig: {
        nbResultsPerPage,

        // offset pagination
        page,

        // cursor pagination
        startingAfter,
        endingBefore,
      },
      orderConfig: {
        orderBy,
        order,
      },
      // eslint-disable-next-line no-underscore-dangle
      useOffsetPagination: req._useOffsetPagination,
    })

    paginationMeta.results = Task.exposeAll(paginationMeta.results, { req })

    return paginationMeta
  })

  responder.on('read', async (req) => {
    const { platformId } = req
    const { env } = req
    const { Task } = await getModels({ platformId, env })

    const { taskId } = req

    const task = await Task.query().findById(taskId)
    if (!task) throw createError(404)

    return Task.expose(task, { req })
  })

  responder.on('create', async (req) => {
    const { platformId } = req
    const { env } = req
    const { Event, Task } = await getModels({ platformId, env })

    const fields = [
      'executionDate',
      'recurringPattern',
      'recurringTimezone',
      'eventType',
      'eventMetadata',
      'eventObjectId',
      'active',
      'metadata',
      'platformData',
    ]

    const payload = _.pick(req, fields)

    const createAttrs = {
      id: await getObjectId({ prefix: Task.idPrefix, platformId, env }),
      ...payload,
    }

    const { eventType, executionDate, recurringPattern, recurringTimezone } =
      payload

    if (recurringPattern && executionDate) {
      throw createError(
        400,
        'Cannot provide both executionDate and recurringPattern',
      )
    }

    if (recurringPattern && !isValidCronPattern(recurringPattern)) {
      throw createError(400, 'Invalid recurring pattern')
    }
    if (recurringTimezone && !isValidTimezone(recurringTimezone)) {
      throw createError(400, 'Invalid recurring timezone')
    }

    if (executionDate) {
      createAttrs.executionDate = getRoundedDate(executionDate, {
        nbMinutes: 1,
      })
    }

    if (Event.isCoreEventFormat(eventType)) {
      throw createError(422, Event.getBadCustomEventTypeMessage())
    }

    const task = await Task.query().insert(createAttrs)

    if (task.active) {
      // Do not include `metadata` or `platformData` to save space in Redis
      await setSaltanaTask({
        platformId,
        env,
        task: _.omit(task, ['metadata', 'platformData']),
      })
    }

    return Task.expose(task, { req })
  })

  responder.on('update', async (req) => {
    const { platformId } = req
    const { env } = req
    const { Event, Task } = await getModels({ platformId, env })

    const { taskId } = req

    const fields = [
      'executionDate',
      'recurringPattern',
      'recurringTimezone',
      'eventType',
      'eventMetadata',
      'eventObjectId',
      'active',
      'metadata',
      'platformData',
    ]

    const payload = _.pick(req, fields)

    const {
      eventType,
      executionDate,
      recurringPattern,
      recurringTimezone,
      metadata,
      platformData,
    } = payload

    const task = await Task.query().findById(taskId)
    if (!task) throw createError(404)

    const updateAttrs = _.omit(payload, ['metadata', 'platformData'])

    const newExecutionDate =
      typeof executionDate !== 'undefined' ? executionDate : task.executionDate
    const newRecurringPattern =
      typeof recurringPattern !== 'undefined'
        ? recurringPattern
        : task.recurringPattern

    if (newExecutionDate && newRecurringPattern) {
      throw createError(
        400,
        'Cannot provide both executionDate and recurringPattern',
      )
    }

    if (recurringPattern && !isValidCronPattern(recurringPattern)) {
      throw createError(400, 'Invalid recurring pattern')
    }
    if (recurringTimezone && !isValidTimezone(recurringTimezone)) {
      throw createError(400, 'Invalid recurring timezone')
    }

    if (executionDate) {
      updateAttrs.executionDate = getRoundedDate(executionDate, {
        nbMinutes: 1,
      })
    }

    if (eventType && Event.isCoreEventFormat(eventType)) {
      throw createError(422, Event.getBadCustomEventTypeMessage())
    }

    if (metadata) {
      updateAttrs.metadata = Task.rawJsonbMerge('metadata', metadata)
    }
    if (platformData) {
      updateAttrs.platformData = Task.rawJsonbMerge(
        'platformData',
        platformData,
      )
    }

    const newTask = await Task.query().patchAndFetchById(taskId, updateAttrs)

    if (newTask.active) {
      // Do not include `metadata` or `platformData` to save space in Redis
      await setSaltanaTask({
        platformId,
        env,
        task: _.omit(newTask, ['metadata', 'platformData']),
      })
    } else {
      await removeSaltanaTask({ platformId, env, taskId: newTask.id })
    }

    return Task.expose(newTask, { req })
  })

  responder.on('remove', async (req) => {
    const { platformId } = req
    const { env } = req
    const { Task } = await getModels({ platformId, env })

    const { taskId } = req

    const task = await Task.query().findById(taskId)
    if (!task) {
      return { id: taskId }
    }

    await removeTask({ taskId, platformId, env })

    return { id: taskId }
  })

  // EVENTS

  eventSubscriber.on(
    'eventCreated',
    async ({ event, platformId, env } = {}) => {
      const { Event, Task } = await getModels({ platformId, env })

      const isDeletingObject =
        Event.isCoreEventFormat(event.type) && event.type.endsWith('__deleted')
      if (!isDeletingObject || !event.objectId) return

      const tasks = await Task.query().where({ eventObjectId: event.objectId })

      await bluebird.map(
        tasks,
        async (task) => {
          try {
            await removeTask({ taskId: task.id, platformId, env })
          } catch (err) {
            logError(err, {
              platformId,
              env,
              message: `Fail to remove task ID ${task.id} after object deletion`,
            })
          }
        },
        { concurrency: 5 },
      )
    },
  )
}

module.exports = {
  start,
  stop,
}
