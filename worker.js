const express = require('express'),
    cluster = require('cluster'), // access to cluster.worker.id
    http = require('http'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    debug = require('debug')('scan-api:server'),
    config = require('./config/config'),
    c = config.color,
    sockIOv2 = require('./routes/socket.io.v2'),
    sockIOjwt = require('./routes/socket.io.jwt'),
    rest = require('./routes/services');

debug('booting %s', 'scan-api');

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
const port1 = normalizePort(process.env.PORT1 || config.server.port1 || 3000); // HTTP SRV1 port
const port2 = normalizePort(process.env.PORT2 || config.server.port2 || 3001); // HTTP SRV2 port

/**
 * Setup Node servers
 * HTTP server1 listen on port 3000/2020, use express middleware and serve HTTP REST API v.2 requests
 * HTTP server2 listen on port 3001/2021 and serve Socket.io API v.2 requests
 */
let wid = cluster.worker.id;
if (wid % 2 === 0) {
    /** HTTP server1 */
    app.set('port', config.server.ip + ':' + port1); // set HTTP server port
    const server1 = http.createServer(app); // create HTTP server for REST API requests
    server1.listen(port1); // Listen Node server on provided port
    console.log(`${c.cyan}HTTP ${c.green}server1${c.cyan} listen port ${c.green}${port1}${c.cyan} on Worker ${c.yellow}${wid}${
        c.cyan
    } and serv:
    ${c.magenta}> HTTP REST ${c.red}API v.2${c.white}`);
    server1.on('error', onError1); // server event hanlers 'on.error'
    server1.on('listening', onListening); // server event hanlers 'on.listening'
    //  Event listener for HTTP server "listening" event.
    function onListening() {
        let addr = server1.address();
        let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
        list_addr(bind);
    }
} else {
    /** HTTP server2 */
    const server2 = http.createServer(); // create HTTP server for Socket.io workers
    server2.listen(port2);
    sockIOv2(server2); // API v.2 socket.io
    sockIOjwt(server2); // AUTH JWT socket.io API
    console.log(`${c.cyan}HTTP ${c.green}server2${c.cyan} listen port ${c.green}${port2}${c.cyan} on Worker ${c.yellow}${wid}${
        c.cyan
    } and serv:
    ${c.magenta}> Socket.io ${c.red}API v.2${c.white}
    ${c.magenta}> Socket.io ${c.red}AUTH JWT API${c.white}`);
    server2.on('error', onError2); // server event hanlers 'on.error'
    server2.on('listening', onListening); // server event hanlers 'on.listening'
    //  Event listener for HTTP server "listening" event.
    function onListening() {
        let addr = server2.address();
        let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
        list_addr(bind);
    }
}

/** workerId memUsage */
setInterval(() => {
    let mem = process.memoryUsage();
    console.log(`${c.magenta}Worker ${wid} Memory usage:
     ${c.green}rss: ${c.yellow}${Math.floor(mem.rss / 1024 / 1024)} MB
     ${c.green}heapTotal: ${c.yellow}${Math.floor(mem.heapTotal / 1024 / 1024)} MB
     ${c.green}heapUsed: ${c.yellow}${Math.floor(mem.heapUsed / 1024 / 1024)} MB
     ${c.green}external: ${c.yellow}${Math.floor(mem.external / 1024 / 1024)} MB${c.white}`);
}, 5000);

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
    console.log(c.cyan + 'Worker %d ' + c.yellow + 'Listening on ' + c.cyan + config.server.ip + ' ' + c.white + '%s', wid, bind);
