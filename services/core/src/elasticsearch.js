// Elasticsearch Node.js API: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
const { Client } = require('@elastic/elasticsearch')
const createError = require('http-errors')
const _ = require('lodash')
const esConfig = require('config').get('ExternalServices.elasticsearch')
const { getPlatformEnvData } = require('./redis')
const {
  autoExpandReplicas,
  getNewIndexProperties,
  getIndexMappingTemplate,
} = require('./elasticsearch-templates')

const connectionClients = {}
const cacheClients = {}

function getClientCacheKey(connection) {
  const { host, protocol, port, user, password } = connection

  return JSON.stringify({
    host,
    protocol,
    port,
    user,
    password,
  })
}

function getConnectionClient(connection = {}) {
  const key = getClientCacheKey(connection)
  if (connectionClients[key]) return connectionClients[key]

  const { host, protocol, port, user, password } = connection

  const useAuth = user && password

  const hidePort =
    (port === '80' && protocol === 'http') ||
    (port === '443' && protocol === 'https')

  // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-configuration.html
  const params = {
    node: `${protocol}://${host}${hidePort ? '' : `:${port}`}`,
  }

  if (useAuth) {
    params.auth = {
      username: user,
      password,
    }
  }

  const client = new Client(params)

  connectionClients[key] = client
  return client
}

async function getClient({ platformId, env } = {}) {
  if (!platformId) {
    throw new Error('Missing platformId when creating an Elasticsearch client')
  }
  if (!env) {
    throw new Error('Missing environment when creating an Elasticsearch client')
  }
  if (esConfig.get('enabled') === false) {
    throw Error('Elasticsearch is not enabled')
  }

  const cacheKey = `${platformId}_${env}`

  if (cacheClients[cacheKey]) return cacheClients[cacheKey]

  const connection = {
    host: esConfig.get('host'),
    protocol: esConfig.get('protocol'),
    user: esConfig.get('user'),
    password: esConfig.get('password'),
    port: esConfig.get('port'),
  }

  const client = getConnectionClient(connection)

  cacheClients[cacheKey] = client
  return client
}

async function isReady({
  platformId,
  env,
  nbAttempts = 3,
  attemptsInterval = 2000,
}) {
  const client = await getClient({ platformId, env })

  for (let i = 1; i <= nbAttempts; i++) {
    try {
      await client.info()
      return true
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, attemptsInterval))
    }
  }

  return false
}

/**
 * Get index name, that is an alias by default.
 * Aliases are a powerful way to re-index data with no downtime.
 * https://www.elastic.co/guide/en/elasticsearch/guide/current/index-aliases.html
 * @param {Object}
 * @param {String} platformId - Name of new index used to produce alias if aliasWithoutVersionSuffix
 * @param {String} env
 * @param {Boolean} [type=asset] - type of index objects
 * @param {String}  [tag] - index tag (e.g. 'new')
 * @return {String} - Index name/alias
 */
function getIndex({ platformId, env, type = 'asset', tag } = {}) {
  let index = `index_${type}`

  if (!env) throw new Error('Missing environment')

  // if (process.env.REMOTE_STORE === 'true') {
  //   index += `_${platformId ? `${platformId}_${env}` : ''}`
  // }

  index += `${tag ? `__${tag}` : ''}`

  return index
}

async function getListIndices({ platformId, env, type }) {
  const client = await getClient({ platformId, env })
  const indexPattern = `${getIndex({ platformId, env, type })}*`

  const { body: result } = await client.indices.getAlias({
    index: indexPattern,
  })

  return result
}

async function isIndexExisting({ platformId, env, type, tag } = {}) {
  const client = await getClient({ platformId, env })
  const index = getIndex({ platformId, env, type, tag })

  const { body: indexExists } = await client.indices.exists({ index })
  return indexExists
}

/**
 * Create index
 * 'useAlias' parameter should be set to false when creating a new index.
 * Aliases are a powerful way to re-index data with no downtime.
 * https://www.elastic.co/guide/en/elasticsearch/guide/current/index-aliases.html
 * @param {Object}
 * @param {String} platformId - Name of new index used to produce alias if aliasWithoutVersionSuffix
 * @param {String} env
 * @param {String} type - type of index objects
 * @param {Boolean} useAlias - if true, set an alias to this index
 * @param {String}  [aliasTag] - alias tag (e.g. 'new')
 * @param {Function}  [customBodyFn] - must return the customized body (custom mappings, settings...)
 * @return {String} - Index
 */
async function createIndex({
  platformId,
  env,
  type,
  customAttributes,
  useAlias = false,
  aliasTag,
  customBodyFn,
} = {}) {
  const client = await getClient({ platformId, env })

  // YYYY-MM-DDTHH:MM:SS.sssZ is converted into YYYY_MM_DD_HH_MM_SS_sssz
  // create a date tag so it is easy to identify them, must be lowercase
  const tag = new Date()
    .toISOString()
    .replace(/[T.:-]/gi, '_')
    .toLowerCase()
  const index = getIndex({ platformId, env, tag })

  const { body } = getNewIndexProperties({
    customBodyFn: (body) => {
      body.aliases = {}

      if (env === 'live') {
        _.set(body, 'settings.index.auto_expand_replicas', autoExpandReplicas)
      }

      if (typeof customBodyFn === 'function') body = customBodyFn(body)
      return body
    },
    addMapping: true,
    customAttributes,
  })

  if (useAlias) {
    const alias = getIndex({ platformId, env, type, tag: aliasTag })
    body.aliases[alias] = {}
  }

  await client.indices.create({ index, body })

  return index
}

async function deleteIndex({ platformId, env, type, tag } = {}) {
  const client = await getClient({ platformId, env })
  const index = getIndex({ platformId, env, type, tag })

  await client.indices.delete({ index })
}

async function getCurrentIndex({ platformId, env, type }) {
  const indices = await getListIndices({ platformId, env, type })
  const currentIndexAlias = getIndex({ platformId, env, type })

  let currentIndex

  Object.keys(indices).forEach((index) => {
    if (currentIndex) return

    if (indices[index].aliases[currentIndexAlias]) {
      currentIndex = index
    }
  })

  return currentIndex
}

async function getMapping({ platformId, env, type, tag }) {
  const client = await getClient({ platformId, env })
  const index = getIndex({ platformId, env, type, tag })

  const { body: result } = await client.indices.getMapping({
    index,
  })

  if (!result) return result

  // can be different from searched index due to aliases
  const indexName = Object.keys(result)[0]

  return result[indexName].mappings
}

async function updateMapping({
  platformId,
  env,
  type = 'asset',
  customAttributes,
  tag,
} = {}) {
  const mapping = getIndexMappingTemplate({ type, customAttributes })

  const client = await getClient({ platformId, env })
  const index = getIndex({ platformId, env, type, tag })

  await client.indices.putMapping({
    index,
    body: mapping,
  })
}

const REGEX_MAPPING_TYPE_ERROR = /mapper \[.*\] of different type/

/**
 * Standardize Elasticsearch error type
 * @param {String} message
 * @return {String} errorType
 */
function getErrorType(message) {
  if (REGEX_MAPPING_TYPE_ERROR.test(message)) {
    return 'MAPPING_TYPE_ERROR'
  }
  return 'OTHER'
}

module.exports = {
  getClient,
  isReady,

  isIndexExisting,
  createIndex,
  deleteIndex,
  getIndex,
  getListIndices,
  getCurrentIndex,

  getMapping,
  updateMapping,

  getErrorType,
}
