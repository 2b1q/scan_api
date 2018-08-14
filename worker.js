const express = require('express'),
    cluster = require('cluster'), // access to cluster.worker.id
    http = require('http'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    debug = require('debug')('scan-api:server'),
    config = require('./config/config'),
    sockIOv1 = require('./routes/socket.io.v1'),
    sockIOv2 = require('./routes/socket.io.v2'),
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

function normalizePort(val) {
    let p = parseInt(val, 10);
    if (p >= 0) return p; // port number
    if (isNaN(p)) return val; // named pipe
    return false;
}

// Normalize a port into a number, string, or false
const port1 = normalizePort(process.env.PORT || config.server.port); // Get port from environment
const port2 = 3001;

/**
 * Setup Node WS server
 */
let wid = cluster.worker.id;
if (wid % 2 === 0) {
    app.set('port', config.server.ip + ':' + port1); // set HTTP server port
    const server1 = http.createServer(app); // create HTTP server
    server1.listen(port1); // Listen Node server on provided port
    sockIOv1(server1); // API v.1 socket.io

    console.log(`IO1_SRVS running on ${wid}`);
    server1.on('error', onError1); // server event hanlers 'on.error'
    server1.on('listening', onListening); // server event hanlers 'on.listening'

    //  Event listener for HTTP server "listening" event.
    function onListening() {
        let addr = server1.address();
        let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
        list_addr(bind);
    }
} else {
    const server2 = http.createServer(); // create HTTP server for IO API2
    server2.listen(port2); // Listen API2 port
    sockIOv2(server2); // API v.2 socket.io

    console.log(`IO2_SRVS running on ${wid}`);
    server2.on('error', onError2); // server event hanlers 'on.error'
    server2.on('listening', onListening); // server event hanlers 'on.listening'
    //  Event listener for HTTP server "listening" event.
    function onListening() {
        let addr = server2.address();
        let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
        list_addr(bind);
    }
}

// Event listener for HTTP server "error" event.
function onError1(error) {
    if (error.syscall !== 'listen') throw error;
    let bind1 = typeof port1 === 'string' ? 'Pipe ' + port1 : 'Port1 ' + port1;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind1} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind1} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}

// Event listener for HTTP server "error" event.
function onError2(error) {
    if (error.syscall !== 'listen') throw error;
    let bind2 = typeof port2 === 'string' ? 'Pipe ' + port2 : 'Port2 ' + port2;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind2} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind2} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}

const list_addr = (bind) =>
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
        wid,
        bind
    );
