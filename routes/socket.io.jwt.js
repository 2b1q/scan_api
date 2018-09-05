// socket.io controller
const cluster = require('cluster'),
    jwt = require('../models/sso/jwt'),
    config = require('../config/config'),
    c = config.color,
    logger = require('../utils/logger')(module),
    moment = require('moment'),
    check = require('../utils/checker').cheker();

// fake JWT
const token = {
    access_token:
        'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdXRoRGF0YSI6eyJhY3RpdmUiOmZhbHNlLCJyb2xlcyI6WyJDVV91c2VyIl0sImFjY291bnRJZCI6IjViOGQzNmIxZDRhZGMyMDAwMTM2YTgyMSJ9LCJzZXJ2aWNlSWQiOiJnZW5lcmFsIiwidG9rZW5UeXBlIjoiYWNjZXNzX3Rva2VuIiwiZXhwIjoxNTM2NTAwNTczLCJpc3MiOiJiYW5rZXgtdG9rZW5pemF0aW9uLXByb2ZpbGUtc3NvLXNlcnZlciJ9.ipsJgmp6Ka4wWD8y5QF_F1Caz1U0IQfSZskUgXw7aQl_ovk-6BXcaIpa2Nin7TJgWR-b3SNO9Gx-ZFvA-etNQnOoR_5ZQRbIhAtLDYrTbLtzVWkEsoDdnGu5YDqU9YqKNLch26cdqYRBfiIUDpT8NtDt_PqKdWbkHdiywyfg5Pk',
};

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
    io.use((socket, response) => {
        // let con_obj = {
        //     client_ip: socket.handshake.address,
        //     url: socket.handshake.url,
        //     query: socket.handshake.query,
        //     sid: socket.client.id,
        // };
        let client_token = socket.handshake.query.token;
        console.log(`jwt_from_client: ${client_token}`);
        if (!client_token) return response('bad token');
        response(client_token);
    });

    io.on('connection', (socket) => {
        let err_log; // errors
        console.log(
            wid_ptrn(`client ${c.magenta}${socket.handshake.address}${c.green} connected to URL PATH ${c.magenta}${socket.handshake.url}${c.green}`)
        );

        /*jwt.verify(client_token)
            .then((data) => {
                console.log(`client_token ${client_token} verified. ${{ data: data }}`);
                socket(`client_token ${client_token} verified. ${{ data: data }}`);
            })
            .catch((e) => {
                console.log(`client_token ${client_token} Not verified`);
                socket(`client_token ${client_token} Not verified`);
            });*/

        // const e_wrapper = (event, data) => {
        //     if (typeof data !== 'function') err_log = { error: '2nd argument is not a function', con_object: con_obj };
        // };
        // console.log(
        //     wid_ptrn(`client ${c.magenta}${socket.handshake.address}${c.green} connected to URL PATH ${c.magenta}${socket.handshake.url}${c.green}`)
        // );
        //
        // /** socket.on(eventName, cb(arg1, arg2))
        //  *  arg1 = payload, arg2 = cb function(err){}
        //  * */
        // /** event handler */
        // socket.on('private_event', (data, err) => e_wrapper('private_event', data));

        /** 'disconnection' event handler */
        socket.on('disconnection', (data) => log_event('disconnection', data, con_obj));
        /** 'error' event handler */
        socket.on('error', (error) => logger.error(error));

        // log error
        if (err_log) logger.error(err_log);
    });
};

// init socket.io middleware
module.exports = (server) => init_io_handler(require('socket.io')(server, io_opts));
