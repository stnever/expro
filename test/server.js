const express = require('express'),
      expro = require('../expro'),
      wrap = expro.wrapAsync,
      Promise = require('bluebird')

function newValidationError() {
  let err = new Error('Validation errors')
  err.errors = [
    {field: 'name', message: 'Name is required'}
  ]
  return err
}

function newHttpError(httpStatus) {
  let err = new Error('HTTP error')
  err.httpStatus = httpStatus
  return err
}

// ========================================================
// old mode, without using any promises
let old = express.Router()
old.get('/success', (req, res) => {
  Promise.resolve({name: 'bob'}).then(data => res.json(data))
})

old.get('/validation-error', (req, res, next) => {
  Promise.reject(newValidationError()).catch(next)
})

old.get('/operational-error', (req, res, next) => {
  Promise.reject(newHttpError(403)).catch(next)
})

old.get('/unexpected-error', (req, res, next) => {
  Promise.try(() => x).catch(next)  // throws ReferenceError
})

old.get('/sync-error', (req, res, next) => {
  x++ // throws ReferenceError
})

// ========================================================
// using promises, but not async/await
let promised = express.Router()
promised.get('/success', (req, res) => {
  res.promise = Promise.resolve({name: 'alice'})
})

promised.get('/validation-error', (req, res) => {
  res.promise = Promise.reject(newValidationError())
})

promised.get('/operational-error', (req, res) => {
  res.promise = Promise.reject(newHttpError(403))
})

promised.get('/unexpected-error', (req, res) => {
  res.promise = Promise.try(() => x) // throws ReferenceError
})

promised.get('/sync-error', (req, res) => {
  x++ // throws ReferenceError
})

// ========================================================
// using async/await
let withAsync = express.Router()
withAsync.get('/success', wrap(async req => {
  await Promise.delay(100)
  return {name: 'charlie'}
}))

withAsync.get('/validation-error', wrap(async req => {
  throw newValidationError()
}))

withAsync.get('/operational-error', wrap(async req => {
  throw newHttpError(403)
}))

withAsync.get('/unexpected-error', wrap(async req => {
  x++ // throws ReferenceError
}))

let app = express()

expro.setup({
  onError: function(err) {
    console.log('in error handler', err.message)
  }
})

app.use(expro.middleware)
app.use('/old', old)
app.use('/promised', promised)
app.use('/withAsync', withAsync)
app.use(expro.errorHandler)

let server = null
function start() {
  return Promise.fromCallback(cb => {
    server = app.listen(3333, cb)
  }).tap(() => console.log('server listening on port 3333'))
}

function stop() {
  server.close()
}

module.exports = {start, stop}

if ( require.main == module )
  start()
