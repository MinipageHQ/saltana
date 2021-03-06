import {
  isSecretApiKey,
  interpolatePath,
  getDataFromArgs,
  getOptionsFromArgs,
  addReadOnlyProperty,
  decodeJwtToken,
  isPromise,
} from './utils'

function getRequestOpts(requestArgs, spec, tokens) {
  const { path, method = 'GET', urlParams = [] } = spec

  // Don't mutate args externally.
  const args = [].slice.call(requestArgs)

  const requestMethod = method.toUpperCase()

  const urlData = {}

  // Check that all specified url params have been provided
  urlParams.forEach((urlParam) => {
    const arg = args[0]
    if (typeof arg !== 'string') {
      throw new Error(
        `Saltana: "${urlParam}" must be a string, but got: ${typeof arg}` +
          ` (on API request to ${requestMethod} ${path})`
      )
    }

    urlData[urlParam] = args.shift()
  })

  let requestPath = path
  if (urlParams.length) {
    requestPath = interpolatePath(path, urlData)
  }

  // Pull request data/queryParams and options (headers) from args.
  let data = {}
  let queryParams = {}

  if (method === 'GET') {
    queryParams = getDataFromArgs(args)
  } else {
    data = getDataFromArgs(args)
  }

  const options = getOptionsFromArgs(args)

  // Validate that there are no more args.
  if (args.length) {
    throw new Error(
      `Saltana: Unknown arguments (${args}). Did you mean to pass an options object?` +
        ` (on API request to ${requestMethod} ${path})`
    )
  }

  const headers = Object.assign(options.headers, spec.headers)
  if (tokens && tokens.accessToken) {
    headers.authorization = `Bearer ${tokens.accessToken}`
  }

  return {
    requestMethod,
    requestPath,
    queryParams,
    data,
    headers,
    tokens,
  }
}

function handlePaginationMeta(res) {
  if (Array.isArray(res)) return res

  const cursorPagination = typeof res.hasNextPage !== 'undefined'

  let paginationMeta

  if (cursorPagination) {
    paginationMeta = {
      hasPreviousPage: res.hasPreviousPage,
      hasNextPage: res.hasNextPage,
      startCursor: res.startCursor,
      endCursor: res.endCursor,
      nbResultsPerPage: res.nbResultsPerPage,
    }
  } else {
    paginationMeta = {
      nbResults: res.nbResults,
      nbPages: res.nbPages,
      page: res.page,
      nbResultsPerPage: res.nbResultsPerPage,
    }
  }

  const newResponse = res.results || [] // add empty array for tests

  const lastResponse = res.lastResponse

  // copy the last response from the previous object (is lost otherwise)
  addReadOnlyProperty(newResponse, 'lastResponse', lastResponse)
  addReadOnlyProperty(newResponse, 'paginationMeta', paginationMeta)

  return newResponse
}

function getTokens(self) {
  return Promise.resolve().then(async () => {
    const apiKey = self._saltana.getApiField('key')

    const needsAuthToken = !isSecretApiKey(apiKey)
    if (!needsAuthToken) return

    const tokenStore = self._saltana.getApiField('tokenStore')

    const isGetterPromise = tokenStore.getTokens instanceof Promise
    const _tokens = tokenStore.getTokens()
    const tokens = isGetterPromise ? await _tokens : _tokens

    if (!tokens) return

    const beforeRefreshToken = self._saltana.getApiField('beforeRefreshToken')

    const canRefreshToken = !!tokens.refreshToken || beforeRefreshToken
    if (!canRefreshToken) return tokens

    const accessToken = tokens.accessToken
    const refreshToken = tokens.refreshToken

    const parsedAccessToken = decodeJwtToken(accessToken)
    const isExpiredToken = new Date(parsedAccessToken.exp * 1000) < new Date()

    if (!isExpiredToken) {
      return tokens
    }

    if (beforeRefreshToken) {
      // wrap `beforeRefreshToken` so it can be a callback or a promise
      const beforeRefreshTokenPromise = (tokens) => {
        return new Promise((resolve, reject) => {
          const callback = (err, newTokens) => {
            if (err) reject(err)
            else resolve(newTokens)
          }

          const returnedObject = beforeRefreshToken(tokens, callback)

          if (isPromise(returnedObject)) {
            returnedObject.then(resolve).catch(reject)
          }
        })
      }

      return beforeRefreshTokenPromise(tokens)
        .then((newTokens) => {
          if (typeof newTokens !== 'object') {
            throw new Error('Wrong result')
          }

          tokenStore.setTokens(newTokens)

          return newTokens
        })
        .catch(() => tokens)
    } else {
      return getNewAccessToken(self, refreshToken)
        .then((accessToken) => {
          const newTokens = Object.assign({}, tokens, { accessToken })
          tokenStore.setTokens(newTokens)

          return newTokens
        })
        .catch((err) => {
          if (err.lastResponse && err.lastResponse.statusCode === 403) {
            const error = Object.assign({}, err, {
              message: 'User session expired',
            })
            self._saltana._emitError('userSessionExpired', error)
            tokenStore.removeTokens()
            throw error
          }

          return tokens
        })
    }
  })
}

function getNewAccessToken(self, refreshToken) {
  const requestParams = {
    path: '/auth/token',
    method: 'POST',
    data: {
      refreshToken,
      grantType: 'refreshToken',
    },
  }

  return self._request(requestParams).then((res) => res.accessToken)
}

export default function makeRequest(self, requestArgs, spec) {
  return Promise.resolve()
    .then(() => getTokens(self))
    .then((tokens) => {
      const opts = getRequestOpts(requestArgs, spec, tokens)

      let requestParams = {
        path: opts.requestPath,
        method: opts.requestMethod,
        data: opts.data,
        queryParams: opts.queryParams,
        options: { headers: opts.headers, tokens: opts.tokens },
      }

      if (spec.beforeRequest) {
        requestParams = spec.beforeRequest(requestParams, self, tokens)
      }

      return self
        ._request(requestParams)
        .then((res) => {
          if (spec.isList) {
            res = handlePaginationMeta(res)
          }

          const response = spec.transformResponseData
            ? spec.transformResponseData(res)
            : res
          return response
        })
        .then((res) => {
          if (spec.afterRequest) {
            return spec.afterRequest(res, self)
          }

          return res
        })
    })
}
