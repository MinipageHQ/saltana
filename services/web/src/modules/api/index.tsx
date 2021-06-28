import { getSession, useSession, signOut } from 'next-auth/client'
import { QueryClient, useQuery, useMutation } from 'react-query'
import { createInstance } from '@saltana/sdk'

export const sharedSaltanaInstance = createInstance({
  apiKey: process.env.NEXT_PUBLIC_SALTANA_CORE_PUBLISHABLE_KEY,
  apiHost: process.env.NEXT_PUBLIC_CORE_API_HOST,
})

export async function getSaltanaInstance(_session = undefined) {
  const session = _session || (await getSession())

  if (!session) {
    return sharedSaltanaInstance
  }

  const newInstance = createInstance({
    apiKey: process.env.NEXT_PUBLIC_SALTANA_CORE_PUBLISHABLE_KEY,
    apiHost: process.env.NEXT_PUBLIC_CORE_API_HOST,
  })

  const info = newInstance.auth.setTokens({
    accessToken: session.coreAccessToken,
    refreshToken: session.refreshToken,
    tokenType: 'Bearer',
    userId: session.user.id,
  })

  newInstance.onError('userSessionExpired', function () {
    signOut()
  })

  return newInstance
}

const defaultQueryFn = async ({ queryKey }) => {
  const [resourceType, method, data] = queryKey
  const saltanaInstance = await getSaltanaInstance()

  const sdkResponse = await saltanaInstance[resourceType][method](data)
  return sdkResponse
}

export const queryClientSettings = {
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
    },
  },
}

export const sharedQueryClient = new QueryClient(queryClientSettings)

export function useApi(resourceType, method, data, opts = {}) {
  return useQuery([resourceType, method, data], {
    ...opts,
  })
}

export function useApiMutation(resourceType, method, opts) {
  return useMutation(async (data) => {
    const saltanaInstance = await getSaltanaInstance()
    return saltanaInstance[resourceType][method](data)
  }, opts)
}

export async function prefetchQuery(
  resourceType,
  method,
  data,
  queryClient = sharedQueryClient
) {
  await queryClient.prefetchQuery([resourceType, method, data])
}

// Organizations/Users/Creators
export function useUser(username) {
  return useApi('users', 'read', username)
}

// Asset Types

export function useAssetTypes({ nbResultsPerPage = 100 }) {
  return useApi('assetTypes', 'list', {
    nbResultsPerPage,
  })
}

export function prefetchAssetTypes({ nbResultsPerPage = 100 }) {
  return prefetchQuery('assetTypes', 'list', {
    nbResultsPerPage,
  })
}

// Assets
export function useAssets({ ownerId, nbResultsPerPage = 100 }) {
  return useApi('assets', 'list', {
    ownerId,
    nbResultsPerPage,
  })
}

export function prefetchAssets({ ownerId, nbResultsPerPage = 100 }) {
  return prefetchQuery('assets', 'list', {
    ownerId,
    nbResultsPerPage,
  })
}

// Authenticated
export function useCurrentUser() {
  const [session, loading] = useSession()
  const _api = useApi('users', 'read', session ? session.user.id : null, {
    enabled: !!session,
    initialData: {
      roles: [],
    },
  })
  const is = (usernameOrUserId) => {
    if (!session) {
      return false
    }

    if (usernameOrUserId === session.user.id) {
      return true
    }
    const data = _api.data || {}

    if (usernameOrUserId === data.username) {
      return true
    }

    return false
  }
  return { ..._api, data: _api.data || {}, is, session }
}
