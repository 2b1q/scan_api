// socket.io controller
const cluster = require('cluster'),
    _jwt = require('jsonwebtoken'),
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

// init io AUTH JWT handler
const init_io_handler = (io) => {
    const badAccessToken = { errorCode: 401, errorMessage: 'authentication error. Bad AccessToken' },
        noToken = { errorCode: 401, errorMessage: 'authentication error. Token isset' };
    let access_token; // Access token container

    /** middleware checks before event 'connection'
     * check/verify tempToken is empty or bad
     *  if OK => ask SSO new JWT
     *  else => Send Error
     * check/verify accessToken is empty or bad
     * if OK => connect
     * if EXP => refresh
     * if EXP refresh is bad => Send Error
     * else => Send Error
     * */
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
        // check if no token property in query
        if (!client_token) {
            con_obj.action = noToken;
            logger.auth(con_obj);
            return next(new Error(JSON.stringify(noToken)));
        }
        // check tempToken
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
                    con_obj.error = e;
                    logger.auth(con_obj);
                    next(new Error(JSON.stringify(e)));
                });
        }
        // check accessToken
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
    });
    /** event 'connection' occurred after io.use middleware checks
     * */
    io.on('connection', (socket) => {
        let con_obj = {
            client_ip: socket.handshake.address,
            url: socket.handshake.url,
            query: socket.handshake.query,
            sid: socket.client.id,
            action: 'sso connected',
        };
        console.log(
            wid_ptrn(`client ${c.magenta}${socket.handshake.address}${c.green} connected to URL PATH ${c.magenta}${socket.handshake.url}${c.green}`)
        );
        // store access_token in socket.io handshake
        socket.handshake.accessToken = access_token;

        // set new JWT AccessToken to client app
        socket.emit('newToken', access_token);

        /** 'disconnection' event handler */
        socket.on('disconnect', () => {
            con_obj.action = 'sso user disconnect';
            jwt.ssoLogout(socket.handshake.accessToken).then((sso_msg) => {
                con_obj.sso_msg = sso_msg;
                logger.auth(con_obj);
            });
        });
        /** 'error' event handler */
        socket.on('error', (error) => logger.error(error));
    });
};

// init socket.io middleware
module.exports = (server) => init_io_handler(require('socket.io')(server, io_opts));
