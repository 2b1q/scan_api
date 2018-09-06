// socket.io controller
const cluster = require('cluster'),
    jwt = require('../models/sso/jwt'),
    JSONParse = require('json-parse-safe'),
    config = require('../config/config'),
    c = config.color,
    logger = require('../utils/logger')(module),
    moment = require('moment'),
    check = require('../utils/checker').cheker();

// cluster.worker.id
const wid = cluster.worker.id;

// worker id pattern
const wid_ptrn = (endpoint) =>
    `${c.green}worker[${wid}]${c.red}[JWT]${c.cyan}[socket IO AUTH controller]${c.red} > ${c.green}[${endpoint}] ${c.white}`;

// print event
const print_event = (action) => {
    console.log(`${c.green}worker[${wid}]${c.red}[JWT]${c.cyan}[Event: ${c.yellow}${action}${c.cyan}]${c.white}`);
};

// io JWT options
const io_opts = {
    path: '/wss', // JWT AUTH API PATH
    serveClient: false, // (Boolean): whether to serve the client files
    pingInterval: 10000, // (Number): how many ms without a pong packet to consider the connection closed
    pingTimeout: 5000, //(Number): how many ms before sending a new ping packet
    cookie: false,
};

// log Event
const log_event = (event, data, con_obj) =>
    logger.socket_requests({
        api: 'Auth JWT',
        event: event,
        data: JSON.parse(data),
        timestamp: moment().format('DD.MM.YYYY HH:mm:ss'),
        connected_obj: con_obj,
    });

// init io AUTH JWT handler
const init_io_handler = (io) => {
    const badTempToken = { errorCode: 401, errorMessage: 'authentication error. Bad TempToken' },
        badAccessToken = { errorCode: 401, errorMessage: 'authentication error. Bad AccessToken' },
        noToken = { errorCode: 401, errorMessage: 'authentication error. Token isset' };
    let access_token; // Access token container

    // middleware
    io.use((socket, next) => {
        let con_obj = {
            client_ip: socket.handshake.address,
            url: socket.handshake.url,
            query: socket.handshake.query,
            sid: socket.client.id,
            action: 'sso login',
        };
        logger.auth(con_obj);
        let client_token = JSONParse(socket.handshake.query.token).value;

        console.log(client_token);

        if (client_token.hasOwnProperty('tempToken')) {
            return jwt
                .verifyTempToken(client_token.tempToken)
                .then((at) => {
                    access_token = at;
                    con_obj.action = 'SSO temp token verify => OK';
                    con_obj.new_access_token = access_token;
                    logger.auth(con_obj);
                    next();
                })
                .catch((e) => {
                    con_obj.action = 'SSO temp token verify => FAILED';
                    logger.auth(con_obj);
                    next(new Error(JSON.stringify(badTempToken)));
                });
        }
        if (client_token.hasOwnProperty('accessToken')) {
            return jwt
                .verifyAccessToken(client_token.accessToken)
                .then((at) => {
                    access_token = at;
                    con_obj.access_token = access_token;
                    con_obj.action = 'SSO verify access token => OK';
                    logger.auth(con_obj);
                    next();
                })
                .catch((e) => {
                    con_obj.action = 'SSO verify access token => FAIL';
                    logger.auth(con_obj);
                    next(new Error(JSON.stringify(badAccessToken)));
                });
        }
        return next(new Error(JSON.stringify(noToken)));
    });

    io.on('connection', (socket) => {
        console.log(
            wid_ptrn(`client ${c.magenta}${socket.handshake.address}${c.green} connected to URL PATH ${c.magenta}${socket.handshake.url}${c.green}`)
        );

        // set new JWT AccessToken to client app
        socket.emit('newToken', access_token);

        /** 'disconnection' event handler */
        socket.on('disconnection', (data) => log_event('disconnection', data, con_obj));
        /** 'error' event handler */
        socket.on('error', (error) => logger.error(error));
    });
};

// init socket.io middleware
module.exports = (server) => init_io_handler(require('socket.io')(server, io_opts));
