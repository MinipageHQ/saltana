import Resource from '../Resource'
import { decodeJwtToken } from '../utils'

const method = Resource.method
// we don't actually use this but use clerk's client side sdk
export default class Auth extends Resource {}

Auth.prototype.login = method({
  path: '/auth/login',
  method: 'POST',
  afterRequest: (res, self) => {
    const tokenStore = self._saltana.getApiField('tokenStore')

    tokenStore.setTokens(res)

    return res
  },
})

Auth.prototype.loginWithClerk = method({
  path: '/auth/login/clerk',
  method: 'POST',
  afterRequest: (res, self) => {
    // const tokenStore = self._saltana.getApiField('tokenStore')

    // tokenStore.setTokens(res)

    return res
  },
})

Auth.prototype.setTokens = function (tokens) {
  const tokenStore = this._saltana.getApiField('tokenStore')
  tokenStore.setTokens(tokens)
  return this.info()
}

Auth.prototype.logout = method({
  path: '/auth/logout',
  method: 'POST',
  beforeRequest: (requestParams, self, tokens) => {
    if (tokens && tokens.refreshToken) {
      requestParams.data.refreshToken = tokens.refreshToken
    }

    return requestParams
  },
  afterRequest: (res, self) => {
    const tokenStore = self._saltana.getApiField('tokenStore')
    tokenStore.removeTokens()

    return res
  },
})

Auth.prototype.info = function () {
  const tokenStore = this._saltana.getApiField('tokenStore')

  const infoResult = {
    isAuthenticated: false,
    userId: null,
  }

  if (!tokenStore) return infoResult

  const tokens = tokenStore.getTokens()
  if (!tokens || !tokens.accessToken) return infoResult

  try {
    const parsedToken = decodeJwtToken(tokens.accessToken)
    infoResult.isAuthenticated = true
    infoResult.userId = parsedToken.userId

    return infoResult
  } catch (err) {
    return infoResult
  }
}

Auth.prototype.getTokens = method({
  path: '/auth/token',
  method: 'POST',
  afterRequest: (res, self) => {
    const tokenStore = self._saltana.getApiField('tokenStore')

    tokenStore.setTokens(res)

    return res
  },
})

Auth.prototype.check = method({
  path: '/auth/check',
  method: 'POST',
})
