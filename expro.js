var debug = require('debug')('expro:debug'),
    logError = require('debug')('expro:errors')

// Exports a function that produces the middleware.
module.exports = function expro(opts) {
  opts = opts || {}
  if ( opts.debugFn ) debug = opts.debugFn
  if ( opts.errorFn ) logError = opts.errorFn

  return middleware
}

// Middleware that waits on res.promise if it exists and calls
// next(err) if it rejects. The default behavior when it resolves
// is to call res.json() on the resolved value.
function middleware(req, res, next) {
  next()

  if ( res.promise ) {
    debug('Found res.promise on %s %s', req.method, req.url)
    res.promise.then(function(value) {
      res.json(value)
    }).catch(function(err) {
      debug('Caught promise error', err)
      next(err)
    })
  }
}

// This is an utility error handler that handles HTTP errors
// (objects that have an .httpStatus property), validation errors
// (objects that have an .errors property), and unexpected errors
// (everything else)
module.exports.errorHandler = function(err, req, res, next) {
  if ( err == null ) {
    logError('Expro error handler called with "null" error')
    res.status(500).json({error: 'Unknown Error'})
    return
  }

  var ctor = err.constructor ? err.constructor.name : err.name,
      propNames = Object.getOwnPropertyNames(err)

  debug('Expro error handler: error constructor: %s, ' +
    'propNames: %s, stack:', ctor, propNames, err.stack)

  if ( err.errors ) {
    logError('ValidationErrors during %s %s: %s', req.method,
      req.url, JSON.stringify(err.errors))
    res.status(400).json(err.errors)
  }

  else if ( err.httpStatus ) {
    logError('Operational error during %s %s: %s', req.method,
      req.url, err.httpStatus, err.message)
    res.status(err.httpStatus).json({error: err.message})
  }

  else {
    logError('Unexpected error during %s %s: %s', req.method,
      req.url, err, err.stack)
    res.status(500).json({error: err.name + ' ' + err.message})
  }
}
