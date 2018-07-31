var request = require('request'),
    server = require('./server'),
    Promise = require('bluebird');

beforeAll(() => server.start())
afterAll(() => server.stop())

async function get(prefix, path) {
  let url = `http://localhost:3333/${prefix}/${path}`,
      res = await Promise.fromCallback(cb => request({url, json:true}, cb))
  console.log(`${url} ${res.statusCode} ${JSON.stringify(res.body)}`)
  return res
}

// ==============================================
// old
test('old success', async () => {
  let res = await get('old', 'success')
  expect(res.body.name).toBe('bob')
})

test('old validation error', async () => {
  let res = await get('old', 'validation-error')
  expect(res.statusCode).toBe(400)
  expect(res.body[0].field).toBe('name')
})

test('old operational error', async () => {
  let res = await get('old', 'operational-error')
  expect(res.statusCode).toBe(403)
})

test('old unexpected error', async () => {
  let res = await get('old', 'unexpected-error')
  expect(res.statusCode).toBe(500)
})

test('old sync error', async () => {
  let res = await get('old', 'sync-error')
  expect(res.statusCode).toBe(500)
})

// =============================================
// promised
test('promised success', async () => {
  let res = await get('promised', 'success')
  expect(res.body.name).toBe('alice')
})

test('promised validation error', async () => {
  let res = await get('promised', 'validation-error')
  expect(res.statusCode).toBe(400)
  expect(res.body[0].field).toBe('name')
})

test('promised operational error', async () => {
  let res = await get('promised', 'operational-error')
  expect(res.statusCode).toBe(403)
})

test('promised unexpected error', async () => {
  let res = await get('promised', 'unexpected-error')
  expect(res.statusCode).toBe(500)
})

test('promised sync error', async () => {
  let res = await get('promised', 'sync-error')
  expect(res.statusCode).toBe(500)
})

// ============================================
// async
test('withAsync success', async () => {
  let res = await get('withAsync', 'success')
  expect(res.body.name).toBe('charlie')
})

test('withAsync validation error', async () => {
  let res = await get('withAsync', 'validation-error')
  expect(res.statusCode).toBe(400)
  expect(res.body[0].field).toBe('name')
})

test('withAsync operational error', async () => {
  let res = await get('withAsync', 'operational-error')
  expect(res.statusCode).toBe(403)
})

test('withAsync unexpected error', async () => {
  let res = await get('withAsync', 'unexpected-error')
  expect(res.statusCode).toBe(500)
})
