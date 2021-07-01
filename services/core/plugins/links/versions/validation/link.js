const { utils } = require('../../../serverTooling')
const {
  validation: { Joi },
} = utils

const groupSchema = Joi.string().valid(
  'authorId',
  'targetId',
  'assetId',
  'transactionId'
)

const labelSchema = Joi.string().regex(/^\w+(:\w+)*$/)
const labelWithWildcardSchema = Joi.string().regex(/^(\*|(\w+)(:(\w+|\*))*)$/)
const multipleLabelsWithWildcardSchema = Joi.string().regex(
  /^(\*|(\w+)(:(\w+|\*))*)(,(\*|(\w+)(:(\w+|\*))*))*$/
)

const orderByFields = ['createdDate', 'updatedDate']

const destinationSchema = Joi.string().uri({
  scheme: ['http', 'https'],
  allowQuerySquareBrackets: true,
})

const slugSchema = Joi.string().min(3).max(30).regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/).required()
const linkTypeSchema = Joi.valid(
  'asset',
  'embed',
  'link-list',
  'content',
  'redirect'
)

module.exports = function createValidation(deps) {
  const {
    utils: {
      validation: { objectIdParamsSchema, replaceOffsetWithCursorPagination },
      pagination: { DEFAULT_NB_RESULTS_PER_PAGE },
    },
  } = deps

  const schemas = {}

  // ////////// //
  // 2020-08-10 //
  // ////////// //
  schemas['2020-08-10'] = {}
  schemas['2020-08-10'].list = () => ({
    query: replaceOffsetWithCursorPagination(schemas['2019-05-20'].list.query),
  })

  // ////////// //
  // 2019-05-20 //
  // ////////// //
  schemas['2019-05-20'] = {}
  schemas['2019-05-20'].list = {
    query: Joi.object().keys({
      // order
      orderBy: Joi.string()
        .valid(...orderByFields)
        .default('createdDate'),
      order: Joi.string().valid('asc', 'desc').default('desc'),

      // pagination
      page: Joi.number().integer().min(1).default(1),
      nbResultsPerPage: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(DEFAULT_NB_RESULTS_PER_PAGE),

      // filters
      id: [Joi.string(), Joi.array().unique().items(Joi.string())],
      ownerId: [Joi.string(), Joi.array().unique().items(Joi.string())],
      targetId: [Joi.string(), Joi.array().unique().items(Joi.string())],
      assetId: [Joi.string(), Joi.array().unique().items(Joi.string())],
      transactionId: [Joi.string(), Joi.array().unique().items(Joi.string())],
      label: [
        multipleLabelsWithWildcardSchema,
        Joi.array().unique().items(labelWithWildcardSchema),
      ],
    }),
  }
  schemas['2019-05-20'].read = {
    params: objectIdParamsSchema,
  }
  schemas['2019-05-20'].create = {
    body: Joi.object()
      .keys({
        name: Joi.string().max(255),
        ownerId: Joi.string(),
        slug: slugSchema,
        linkType: linkTypeSchema,
        destination: destinationSchema,
        assetId: Joi.string(),
        content: Joi.object().unknown(),
        metadata: Joi.object().unknown(),
        platformData: Joi.object().unknown(),
        asset: Joi.object().keys({
          description: Joi.string().max(3000).allow('', null),
          categoryId: Joi.string().allow(null),
          assetTypeId: Joi.string(),
          quantity: Joi.number().integer().min(0),
          price: Joi.number().min(0),
          currency: Joi.string(),
          customAttributes: Joi.object().unknown(),
        })
      })
      .required(),
  }
  schemas['2019-05-20'].update = {
    params: objectIdParamsSchema,
    body: schemas['2019-05-20'].create.body
      .fork(['linkType', 'assetId'], (schema) =>
        schema.forbidden()
      )
      //.fork('score', (schema) => schema.optional()),
  }
  schemas['2019-05-20'].remove = {
    params: objectIdParamsSchema,
  }

  const validationVersions = {
    '2020-08-10': [
      {
        target: 'link.list',
        schema: schemas['2020-08-10'].list,
      },
    ],

    '2019-05-20': [
      {
        target: 'link.list',
        schema: schemas['2019-05-20'].list,
      },
      {
        target: 'link.read',
        schema: schemas['2019-05-20'].read,
      },
      {
        target: 'link.create',
        schema: schemas['2019-05-20'].create,
      },
      {
        target: 'link.update',
        schema: schemas['2019-05-20'].update,
      },
      {
        target: 'link.remove',
        schema: schemas['2019-05-20'].remove,
      },
    ],
  }

  return validationVersions
}
