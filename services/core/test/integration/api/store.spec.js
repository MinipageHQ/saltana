const test = require('ava')
const request = require('supertest')

const { before, beforeEach, after } = require('../../lifecycle')
const { getSystemKey } = require('../../auth')
const { getEnvironments } = require('../../../src/util/environment')
const {
  getPostgresqlConnection,
  getElasticsearchConnection,

  getPgSSLServerCertificate,
  getPgSSLCACertificate,
} = require('../../connection')
const { config } = require('process')

const instanceEnv = getEnvironments()[0] || 'test'

test.before(async (t) => {
  await before({ name: 'store' })(t)
  await beforeEach()(t)
})
// test.beforeEach(beforeEach()) // Concurrent tests are much faster
test.after(after())

const isNonEmptyIntegerString = (value) =>
  !!(value && typeof value === 'string' && `${parseInt(value, 10)}` === value)

// Must run serially as it has impact on all env data keys
test.serial('gets, updates and removes platform env data', async (t) => {
  const systemKey = getSystemKey()

  const { platformId } = t.context

  const connection = {
    host: 'example.com',
    port: 5432,
    user: 'user',
    password: null,
    database: 'test',
  }
  const connection2 = {
    host: 'example2.com',
    port: 5432,
    user: 'user',
    password: null,
    database: 'test',
  }

  const { body: beforeCreateData } = await request(t.context.serverUrl)
    .get(`/store/platforms/${platformId}/data/${instanceEnv}`)
    .set({ 'x-saltana-system-key': systemKey })
    .expect(200)

  t.truthy(beforeCreateData) // is truthy because database credentials are set

  const { body: createdData } = await request(t.context.serverUrl)
    .put(`/store/platforms/${platformId}/data/${instanceEnv}`)
    .set({ 'x-saltana-system-key': systemKey })
    .send({ custom: connection, custom2: connection2 })
    .expect(200)

  t.deepEqual(createdData.custom, connection)
  t.deepEqual(createdData.custom2, connection2)

  const { body: data } = await request(t.context.serverUrl)
    .get(`/store/platforms/${platformId}/data/${instanceEnv}`)
    .set({ 'x-saltana-system-key': systemKey })
    .expect(200)

  t.deepEqual(data.custom, connection)
  t.deepEqual(data.custom2, connection2)

  // replace the whole old data object
  const { body: createdData2 } = await request(t.context.serverUrl)
    .put(`/store/platforms/${platformId}/data/${instanceEnv}`)
    .set({ 'x-saltana-system-key': systemKey })
    .send({
      custom: { randomData: true },
      custom2: { randomData2: true },
    })
    .expect(200)

  t.deepEqual(createdData2.custom, { randomData: true })
  t.deepEqual(createdData2.custom2, { randomData2: true })

  await request(t.context.serverUrl)
    .delete(`/store/platforms/${platformId}/data/${instanceEnv}`)
    .set({ 'x-saltana-system-key': systemKey })
    .expect(200)

  const { body: afterRemoveData } = await request(t.context.serverUrl)
    .get(`/store/platforms/${platformId}/data/${instanceEnv}`)
    .set({ 'x-saltana-system-key': systemKey })
    .expect(200)

  t.deepEqual(afterRemoveData, {})

  // reset Database credentials for other tests
  await request(t.context.serverUrl)
    .put(`/store/platforms/${platformId}/data/${instanceEnv}`)
    .set({ 'x-saltana-system-key': systemKey })
    .send(beforeCreateData)
    .expect(200)
})

test('gets, sets and removes platform env data by key', async (t) => {
  const systemKey = getSystemKey()

  const connection = {
    host: 'example.com',
    port: 5432,
    user: 'user',
    password: null,
    database: 'test',
  }

  const { platformId } = t.context

  const { body: beforeCreateData } = await request(t.context.serverUrl)
    .get(`/store/platforms/${platformId}/data/${instanceEnv}/custom`)
    .set({ 'x-saltana-system-key': systemKey })
    .expect(200)

  t.is(beforeCreateData, null)

  const { body: createdData } = await request(t.context.serverUrl)
    .put(`/store/platforms/${platformId}/data/${instanceEnv}/custom`)
    .set({ 'x-saltana-system-key': systemKey })
    .send(connection)
    .expect(200)

  t.deepEqual(createdData, connection)

  const { body: data } = await request(t.context.serverUrl)
    .get(`/store/platforms/${platformId}/data/${instanceEnv}/custom`)
    .set({ 'x-saltana-system-key': systemKey })
    .expect(200)

  t.deepEqual(data, connection)

  // replace the whole old data object
  const { body: createdData2 } = await request(t.context.serverUrl)
    .put(`/store/platforms/${platformId}/data/${instanceEnv}/custom`)
    .set({ 'x-saltana-system-key': systemKey })
    .send({ randomData: true })
    .expect(200)

  t.deepEqual(createdData2, { randomData: true })

  await request(t.context.serverUrl)
    .delete(`/store/platforms/${platformId}/data/${instanceEnv}/custom`)
    .set({ 'x-saltana-system-key': systemKey })
    .expect(200)

  const { body: afterRemoveData } = await request(t.context.serverUrl)
    .get(`/store/platforms/${platformId}/data/${instanceEnv}/custom`)
    .set({ 'x-saltana-system-key': systemKey })
    .expect(200)

  t.is(afterRemoveData, null)
})

test('sync elasticsearch', async (t) => {
  const systemKey = getSystemKey()

  const { platformId } = t.context

  const result = await request(t.context.serverUrl)
    .post(`/store/platforms/${platformId}/elasticsearch/sync`)
    .set({
      'x-saltana-system-key': systemKey,
      'x-saltana-env': t.context.env,
    })
    .expect(200)

  await new Promise((resolve) => setTimeout(resolve, 1000))

  const obj = result.body

  t.true(obj.success)
})

test('sync cache', async (t) => {
  const systemKey = getSystemKey()

  const { platformId } = t.context

  const {
    body: {
      cache: { ok: beforeCheck },
    },
  } = await request(t.context.serverUrl)
    .get(`/store/platforms/${platformId}/check`)
    .set({
      'x-saltana-system-key': systemKey,
      'x-saltana-env': t.context.env,
    })
    .expect(200)

  t.false(beforeCheck)

  // synchronize existing active tasks
  await request(t.context.serverUrl)
    .post(`/store/platforms/${platformId}/cache/sync`)
    .set({
      'x-saltana-system-key': systemKey,
      'x-saltana-env': 'test',
    })
    .expect(200)

  await request(t.context.serverUrl)
    .post(`/store/platforms/${platformId}/cache/sync`)
    .set({
      'x-saltana-system-key': systemKey,
      'x-saltana-env': 'live',
    })
    .expect(200)

  const {
    body: {
      cache: { ok: afterCheck },
    },
  } = await request(t.context.serverUrl)
    .get(`/store/platforms/${platformId}/check`)
    .set({
      'x-saltana-system-key': systemKey,
      'x-saltana-env': t.context.env,
    })
    .expect(200)

  t.true(afterCheck)

  // delete all tasks from cache
  await request(t.context.serverUrl)
    .delete(`/store/platforms/${platformId}/cache`)
    .set({
      'x-saltana-system-key': systemKey,
      'x-saltana-env': t.context.env,
    })
    .expect(200)

  const {
    body: {
      cache: { ok: checkAfterDelete },
    },
  } = await request(t.context.serverUrl)
    .get(`/store/platforms/${platformId}/check`)
    .set({
      'x-saltana-system-key': systemKey,
      'x-saltana-env': t.context.env,
    })
    .expect(200)

  t.false(checkAfterDelete)
})

test('creates a platform, init and reset databases', async (t) => {
  const systemKey = getSystemKey()

  const {
    body: { id: platformId },
  } = await request(t.context.serverUrl)
    .post('/store/platforms')
    .set({ 'x-saltana-system-key': systemKey })
    .expect(200)

  t.true(isNonEmptyIntegerString(platformId))

  const { env } = t.context

  const areDatabasesUp = async ({ postgresql, elasticsearch }) => {
    const postgresqlStatus = postgresql ? 200 : 500
    const elasticsearchStatus = postgresql
      ? // index not found, queries to PostgreSQL still work, so this isn't an error status 500
        elasticsearch
        ? 200
        : 404
      : 500

    await request(t.context.serverUrl)
      .get('/api-keys')
      .set({
        'x-saltana-system-key': systemKey,
        'x-platform-id': platformId,
        'x-saltana-env': env,
      })
      .expect(postgresqlStatus)

    await request(t.context.serverUrl)
      .post('/search')
      .send({ query: 'random' })
      .set({
        'x-saltana-system-key': systemKey,
        'x-platform-id': platformId,
        'x-saltana-env': env,
      })
      .expect(elasticsearchStatus)
  }

  // error because databases aren't initialized and database connection settings are missing
  await areDatabasesUp({ postgresql: false, elasticsearch: false })

  await request(t.context.serverUrl)
    .put(`/store/platforms/${platformId}/data/${env}/postgresql`)
    .set({ 'x-saltana-system-key': systemKey })
    .send(getPostgresqlConnection({ platformId, env }))
    .expect(200)

  if (config.get('ExternalServices.elasticsearch.enabled') === true) {
    await request(t.context.serverUrl)
      .put(`/store/platforms/${platformId}/data/${env}/elasticsearch`)
      .set({ 'x-saltana-system-key': systemKey })
      .send(getElasticsearchConnection())
      .expect(200)
  }

  await request(t.context.serverUrl)
    .post(`/store/platforms/${platformId}/init`)
    .set({
      'x-saltana-system-key': systemKey,
      'x-saltana-env': env,
    })
    .expect(200)

  // api keys and assets can be retrieved
  await areDatabasesUp({ postgresql: true, elasticsearch: true })

  await request(t.context.serverUrl)
    .post(`/store/platforms/${platformId}/elasticsearch/drop`)
    .set({
      'x-saltana-system-key': systemKey,
      'x-saltana-env': env,
    })
    .expect(200)

  // search doesn't work because Elasticsearch is dropped
  await areDatabasesUp({ postgresql: true, elasticsearch: false })

  await request(t.context.serverUrl)
    .post(`/store/platforms/${platformId}/database/drop`)
    .set({
      'x-saltana-system-key': systemKey,
      'x-saltana-env': env,
    })
    .expect(200)

  // api keys and search don't work anymore, all databases dropped
  await areDatabasesUp({ postgresql: false, elasticsearch: false })

  // init databases one by one (instead of the global init)
  await request(t.context.serverUrl)
    .post(`/store/platforms/${platformId}/database/migrate`)
    .set({
      'x-saltana-system-key': systemKey,
      'x-saltana-env': env,
    })
    .expect(200)

  await areDatabasesUp({ postgresql: true, elasticsearch: false })

  await request(t.context.serverUrl)
    .post(`/store/platforms/${platformId}/elasticsearch/init`)
    .set({
      'x-saltana-system-key': systemKey,
      'x-saltana-env': env,
    })
    .expect(200)

  await areDatabasesUp({ postgresql: true, elasticsearch: true })

  t.pass()
})

test('establishes SSL connection with PostgreSQL', async (t) => {
  const systemKey = getSystemKey()

  const createPlatform = async () => {
    const {
      body: { id: platformId },
    } = await request(t.context.serverUrl)
      .post('/store/platforms')
      .set({ 'x-saltana-system-key': systemKey })
      .expect(200)

    t.true(isNonEmptyIntegerString(platformId))

    return platformId
  }

  const { env } = t.context

  const setPostgreSQLConnection = async ({
    platformId,
    ...sslOptions
  } = {}) => {
    await request(t.context.serverUrl)
      .put(`/store/platforms/${platformId}/data/${env}/postgresql`)
      .set({ 'x-saltana-system-key': systemKey })
      .send(getPostgresqlConnection({ platformId, env, ...sslOptions }))
      .expect(200)
  }

  const initDatabase = async ({ platformId, status }) => {
    await request(t.context.serverUrl)
      .post(`/store/platforms/${platformId}/database/migrate`)
      .set({
        'x-saltana-system-key': systemKey,
        'x-saltana-env': env,
      })
      .expect(status)
  }

  const dropDatabase = async ({ platformId }) => {
    await request(t.context.serverUrl)
      .post(`/store/platforms/${platformId}/database/drop`)
      .set({
        'x-saltana-system-key': systemKey,
        'x-saltana-env': env,
      })
      .expect(200)
  }

  const testSSLConnection = async (status, { ...sslOptions } = {}) => {
    const platformId = await createPlatform()

    await setPostgreSQLConnection({ platformId, ...sslOptions })
    await initDatabase({ platformId, status })

    // clean databases
    await setPostgreSQLConnection({
      platformId,
      sslcert: getPgSSLServerCertificate(),
      sslca: getPgSSLCACertificate(),
    })
    await dropDatabase({ platformId })
  }

  // SSL cannot be forced for PostgreSQL client that connects via localhost
  await testSSLConnection(200) // ssl: false

  await testSSLConnection(500, { ssl: true }) // no certificate provided
  await testSSLConnection(500, { ssl: getPgSSLServerCertificate() }) // bad field

  // Pass the content of a .crt file into the field sslkey will trigger an uncaught exception that
  // kills the process even if process.on('uncaughtException', fn) is specified
  // Please be careful when configuring SSL
  // await testSSLConnection(500, { sslkey: getPgSSLServerCertificate() }) // bad field

  await testSSLConnection(500, { sslcert: getPgSSLServerCertificate() }) // missing CA certificate
  await testSSLConnection(500, { sslca: getPgSSLServerCertificate() }) // bad field

  // bad values
  await testSSLConnection(500, {
    sslcert: getPgSSLCACertificate(),
    sslca: getPgSSLServerCertificate(),
  })

  // correct fields
  await testSSLConnection(200, {
    sslcert: getPgSSLServerCertificate(),
    sslca: getPgSSLCACertificate(),
  })

  t.pass()
})
