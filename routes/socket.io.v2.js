// socket.io controller
const cluster = require('cluster'),
    config = require('../config/config'),
    c = config.color,
    e = config.events.client, // socket IO client events
    logger = require('../utils/logger')(module),
    moment = require('moment'),
    check = require('../utils/checker').cheker(),
    tnx_controller = require('../controllers/v2/transaction'),
    block_controller = require('../controllers/v2/block'),
    addr_controller = require('../controllers/v2/address');

const wid = cluster.worker.id; // access to cluster.worker.id
// worker id pattern
const wid_ptrn = (endpoint) =>
    `${c.green}worker[${wid}]${c.red}[API v.2]${c.cyan}[socket IO controller]${c.red} > ${
        c.green
    }[${endpoint}] ${c.white}`;

// io options API v.2
const io_opts = {
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
        console.log(
            wid_ptrn(
                `client ${c.magenta}${socket.handshake.address}${c.green} connected to URL PATH ${
                    c.magenta
                }${socket.handshake.url}${c.green}`
            )
        );

        socket.on('test', (data) => console.log(`API v.2 incoming event 'test'. Data:\n${data}`));

        socket.on('disconnection', (data) => log_event('disconnection', data, con_obj));
        socket.on('error', (error) => {
            console.log(error);
        });
    });
};

// init socket.io middleware
module.exports = (server) => init_io_handler(require('socket.io')(server, io_opts));
