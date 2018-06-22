const express = require('express'),
    path = require('path'),
    // favicon = require('serve-favicon'),
    // logger = require('morgan'),
    // logger = require('./utils/logger'),
    cookieParser = require('cookie-parser'),
    cluster = require('cluster'), // access to cluster.worker.id
    bodyParser = require('body-parser'),
    config       = require('./config/config'),
    // Rest = require('connect-rest'),
    debug = require('debug')('scan-api:server');
    debug('booting %s', 'scan-api')
    // db = require('./libs/db');

// init express framework
const app = express();

// app.use(logger('dev'))
app.use(bodyParser.json())
   .use(bodyParser.urlencoded({ extended: false }))
   .use(cookieParser());
   //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
   // .use(express.static(path.join(__dirname, 'public')));

const rest = require('./routes/services');
app.use('/api', rest)


 // Last ROUTE catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found. Bad API URL');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
 // set locals, only providing error in development
 res.locals.message = err.message;
 res.locals.error = req.app.get('env') === 'development' ? err : {};
 res.status(err.status || 500);
 // res.render('error')
 res.json({ error_msg: err.message })
 console.error(err.message);
});

 /**
 * Setup Node server
 */
const http = require('http');

// Normalize a port into a number, string, or false
const port = (val => {
   let port = parseInt(val, 10);
   if (port >= 0)   return port; // port number
   if (isNaN(port)) return val; // named pipe
   return false;
})(process.env.PORT || config.server.port); // Get port from environment
// set server port
app.set('port', config.server.ip+':'+port);
// create HTTP server
const server = http.createServer(app);
server.listen(port); // Listen Node server on provided port

require('./controllers/middleware')(server) // init socket io

// server event hanlers 'on.error', 'on.listening'
server.on('error', onError);
server.on('listening', onListening);

// Event listener for HTTP server "error" event.
function onError(error) {
 if (error.syscall !== 'listen') throw error;
 let bind = typeof port === 'string' ? 'Pipe ' + port: 'Port ' + port;
 // handle specific listen errors with friendly messages
 switch (error.code) {
   case 'EACCES':
     console.error(`${bind} requires elevated privileges`);
     process.exit(1);
     break;
   case 'EADDRINUSE':
     console.error(`${bind} is already in use`);
     process.exit(1);
     break;
   default:
     throw error;
 }
}

//  Event listener for HTTP server "listening" event.
function onListening() {
  let workerid = cluster.worker.id;
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  // debug(config.color.cyan+'Worker %d '+config.color.yellow+'Listening on '+config.color.cyan+config.server.ip+' '+config.color.white+'%s',workerid, bind);
  console.log(config.color.cyan+'Worker %d '+config.color.yellow+'Listening on '+config.color.cyan+config.server.ip+' '+config.color.white+'%s',workerid, bind)
}
