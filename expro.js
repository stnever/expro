const debug = require('debug')('expro')

/*
Usage:

const expro = require('expro')

// optional
expro.setup(...)

api.use(expro.middleware)
api.use(expro.errorHandler)

// in some route...
const wrap = require('expro').wrapAsync

api.get('/some-path', wrap(async req => {
  return User.findAll()
}))
*/

module.exports = {setup, middleware, errorHandler, wrapAsync}

let PromiseLib = Promise,
    onError = function() { /* no-op */ }

function setup(opts) {
  if ( opts.Promise ) PromiseLib = opts.Promise
  if ( opts.onError ) onError = opts.onError
}

// Middleware that waits on res.promise if it exists and
// calls next(err) if it rejects. The default behavior when
// it resolves is to call res.json() on the resolved value.
function middleware(req, res, next) {
  next()

  if ( res.promise ) {
    debug('Found res.promise on %s %s', req.method, req.url)
    res.promise.then(value => {
      if ( typeof value === 'undefined' ) {
        debug('res.promise resolved to undefined, will not touch response')
      } else {
        // NB: null vem aqui também
        res.json(value)
      }
    }).catch(err => {
      debug('Caught promise error', err)
      next(err)
    })
  }
}

// This is an utility error handler that handles HTTP
// errors (objects that have an .httpStatus property),
// validation errors (objects that have an .errors property),
// and unexpected errors (everything else)
function errorHandler(err, req, res, next) {
  if ( err == null ) {
    debug('Expro error handler called with "null" error')
    res.status(500).json({error: 'Unknown Error'})
    return
  }

  let ctor = err.constructor ? err.constructor.name : err.name,
      propNames = Object.getOwnPropertyNames(err)

  debug('Expro error handler: error constructor: %s, ' +
    'propNames: %s, stack:', ctor, propNames, err.stack)

  try {
    onError(err)
  } catch ( anotherErr ) {
    debug('Error during onError listener', anotherErr.stack)
  }

  if ( err.errors ) {
    debug('ValidationErrors during %s %s: %s', req.method,
      req.url, JSON.stringify(err.errors))
    res.status(400).json(err.errors)
  }

  else if ( err.httpStatus ) {
    debug('Operational error during %s %s: %s', req.method,
      req.url, err.httpStatus, err.message)
    res.status(err.httpStatus).json({error: err.message})
  }

  else {
    debug('Unexpected error during %s %s: %s', req.method,
      req.url, err, err.stack)
    res.status(500).json({error: err.name + ' ' + err.message})
  }
}

function wrapAsync(fn) {
  return function wrappedAsync(req, res, next, ...args) {
    res.promise = PromiseLib.resolve().then(() => {
      return fn(req, res, next, ...args)
    })
  }
}
