// socket.io controller
const config = require('../config/config'),
    c = config.color,
    e = config.events.client, // socket IO client events
    logger = require('../utils/logger')(module),
    moment = require('moment'),
    check = require('../utils/checker').cheker(),
    tnx_controller = require('../controllers/v2/transaction'),
    block_controller = require('../controllers/v2/block'),
    addr_controller = require('../controllers/v2/address');

// io options API v.2
const io_opts = {
    path: '/test', // path
    serveClient: false, // (Boolean): whether to serve the client files
    // below are engine.IO options
    pingInterval: 10000, // (Number): how many ms without a pong packet to consider the connection closed
    pingTimeout: 5000, //(Number): how many ms before sending a new ping packet
    cookie: false,
};

// log Event
const log_event = (event, data, con_obj) =>
    logger.socket_requests({
        api: 'v.2',
        event: event,
        data: JSON.parse(data),
        timestamp: moment().format('DD.MM.YYYY HH:mm:ss'),
        connected_obj: con_obj,
    });

// init io handler
const init_io_handler = (io) => {
    io.on('connection', (socket) => {
        let con_obj = {
            client_ip: socket.handshake.address,
            url: socket.handshake.url,
            query: socket.handshake.query,
            sid: socket.client.id,
        };

        socket.on('disconnection', (data) => log_event('disconnection', data, con_obj));
        socket.on('error', (error) => {
            console.log(error);
        });
    });
};

// init socket.io middleware
module.exports = (server) => init_io_handler(require('socket.io')(server, io_opts));
