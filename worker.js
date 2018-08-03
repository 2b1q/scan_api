const express = require('express'),
    cluster = require('cluster'), // access to cluster.worker.id
    http = require('http'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    debug = require('debug')('scan-api:server'),
    config = require('./config/config'),
    sockIO = require('./routes/sock-io'),
    rest = require('./routes/services'),
    ethProxy = require('./ether/proxy').getInstance(),
    ethSubs = require('./ether/subscribe');

debug('booting %s', 'scan-api');

ethSubs.subscribe(ethProxy);
setInterval(function() {
    ethSubs.subscribe(ethProxy);
}, config.ethOptions.upNodeFrequency);

// init express framework
const app = express();

// app.use(logger('dev'))
app.use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: false }))
    .use(cookieParser());

app.use('/api', rest);

// Last ROUTE catch 404 and forward to error handler
app.use((req, res) => res.status(404).json({ error: 'Not Found. Bad API URL' }));

// error handler
app.use((err, req, res) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.json({ error_msg: err.message });
    console.error(err.message);
});

/**
 * Setup Node HTTP server
 */
// Normalize a port into a number, string, or false
const port = normalizePort(process.env.PORT || config.server.port); // Get port from environment
app.set('port', config.server.ip + ':' + port); // set HTTP server port

const server = http.createServer(app); // create HTTP server
server.listen(port); // Listen Node server on provided port

/**
 * Setup Node WS server
 */

sockIO(server);
server.on('error', onError); // server event hanlers 'on.error'
server.on('listening', onListening); // server event hanlers 'on.listening'

function normalizePort(val) {
    let p = parseInt(val, 10);
    if (p >= 0) return p; // port number
    if (isNaN(p)) return val; // named pipe
    return false;
}

// Event listener for HTTP server "error" event.
function onError(error) {
    if (error.syscall !== 'listen') throw error;
    let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
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
    let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log(
        config.color.cyan +
            'Worker %d ' +
            config.color.yellow +
            'Listening on ' +
            config.color.cyan +
            config.server.ip +
            ' ' +
            config.color.white +
            '%s',
        workerid,
        bind
    );
}
