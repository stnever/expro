var prequest = require('prequest'),
    express = require('express'),
    assert = require('assert'),
    expro = require('../expro'),
    Promise = require('bluebird');

var app = express();

app.use(expro)

app.get('/expected-error', function(req, res) {
  res.promise = Promise.reject({
    httpStatus: 401,
    message: 'You need superuser privileges to call this API'
  })
})

app.get('/validation-error', function(req, res) {
  res.promise = Promise.reject({
    errors: [
      {field: 'name', message: 'Name is required'}
    ]
  })
})

app.get('/unexpected-error', function(req, res) {
  res.promise = Promise.reject(new Error('Something broke hard!'))
})

app.get('/sync-error', function(req, res) {
  x++ // throws ReferenceError
})

app.use(expro.errorHandler)

describe('Expro', function() {
  before(function(done) {
    app.listen(3344, function() {
      done()
    })
  })

  it('should catch an error that knows which HTTP status to send', function() {
    return prequest('http://localhost:3344/expected-error').catch(function(err) {
      assert.equal(err.statusCode, 401)
    })
  })

  it('should catch validation errors', function() {
    return prequest('http://localhost:3344/validation-error').catch(function(err) {
      assert.equal(err.statusCode, 400)
      assert.equal(err.body[0].field, 'name')
    })
  })

  it('should catch unexpected errors', function() {
    return prequest('http://localhost:3344/unexpected-error').catch(function(err) {
      assert.equal(err.statusCode, 500)
      var str = JSON.stringify(err.body)
      // asserts that the response did NOT include an stack trace
      assert.equal(str.indexOf('at'), -1)
      assert(str.indexOf('broke hard') != -1)
    })
  })

  it('should catch programming errors', function() {
    return prequest('http://localhost:3344/sync-error').catch(function(err) {
      assert.equal(err.statusCode, 500)
      var str = JSON.stringify(err.body)
      // asserts that the response did NOT include an stack trace
      assert.equal(str.indexOf('at'), -1)
      assert(str.indexOf('broke hard') != -1)
    })
  })
})
