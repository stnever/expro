var prequest = require('prequest'),
    express = require('express'),
    assert = require('assert'),
    expro = require('../expro'),
    Promise = require('bluebird');

var app = express();

app.use(expro)

app.get('/with-promise', function(req, res) {
  res.promise = Promise.resolve({ name: 'alice' })
})

app.get('/without-promise', function(req, res) {
  Promise.resolve({ name: 'bob' }).then(function(data) {
    res.json(data)
  })
})

describe('Expro', function() {
  before(function(done) {
    app.listen(3333, function() {
      done()
    })
  })

  it('should wait for promise', function() {
    return prequest('http://localhost:3333/with-promise').then(function(res) {
      assert.equal(res.name, 'alice')
    })
  })

  it('should work the old way as well', function() {
    return prequest('http://localhost:3333/without-promise').then(function(res) {
      assert.equal(res.name, 'bob')
    })
  })
})
