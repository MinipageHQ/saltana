import test from 'blue-tape'

import { getSpyableSaltana } from '../../testUtils'

const saltana = getSpyableSaltana()

test('getStats: sends the correct request', (t) => {
  return saltana.ratings.getStats({ orderBy: 'count', page: 2, nbResultsPerPage: 10, groupBy: 'authorId' })
    .then(() => {
      t.deepEqual(saltana.LAST_REQUEST, {
        method: 'GET',
        path: '/ratings/stats',
        data: {},
        queryParams: { orderBy: 'count', page: 2, nbResultsPerPage: 10, groupBy: 'authorId' },
        headers: {}
      })
    })
})

test('list: sends the correct request', (t) => {
  return saltana.ratings.list({ page: 2, nbResultsPerPage: 10 })
    .then(() => {
      t.deepEqual(saltana.LAST_REQUEST, {
        method: 'GET',
        path: '/ratings',
        data: {},
        queryParams: { page: 2, nbResultsPerPage: 10 },
        headers: {}
      })
    })
})

test('read: sends the correct request', (t) => {
  return saltana.ratings.read('rating_1')
    .then(() => {
      t.deepEqual(saltana.LAST_REQUEST, {
        method: 'GET',
        path: '/ratings/rating_1',
        data: {},
        queryParams: {},
        headers: {}
      })
    })
})

test('create: sends the correct request', (t) => {
  const data = {
    score: 80,
    targetId: 'user_2'
  }

  return saltana.ratings.create(data)
    .then(() => {
      t.deepEqual(saltana.LAST_REQUEST, {
        method: 'POST',
        path: '/ratings',
        data,
        queryParams: {},
        headers: {}
      })
    })
})

test('update: sends the correct request', (t) => {
  return saltana.ratings.update('rating_1', { score: 70 })
    .then(() => {
      t.deepEqual(saltana.LAST_REQUEST, {
        method: 'PATCH',
        path: '/ratings/rating_1',
        data: { score: 70 },
        queryParams: {},
        headers: {}
      })
    })
})

test('remove: sends the correct request', (t) => {
  return saltana.ratings.remove('rating_1')
    .then(() => {
      t.deepEqual(saltana.LAST_REQUEST, {
        method: 'DELETE',
        path: '/ratings/rating_1',
        data: {},
        queryParams: {},
        headers: {}
      })
    })
})
