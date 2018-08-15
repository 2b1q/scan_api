// socket.io controller
const cluster = require('cluster'),
    config = require('../config/config'),
    c = config.color,
    e = config.events.client, // socket IO client events
    m = config.modules, // modules
    l = config.list_type, // modules
    logger = require('../utils/logger')(module),
    moment = require('moment'),
    check = require('../utils/checker').cheker(),
    tnx_controller = require('../controllers/v2/transaction'),
    block_controller = require('../controllers/v2/block'),
    addr_controller = require('../controllers/v2/address');

// cluster.worker.id
const wid = cluster.worker.id;

// worker id pattern
const wid_ptrn = (endpoint) =>
    `${c.green}worker[${wid}]${c.red}[API v.2]${c.cyan}[socket IO controller]${c.red} > ${c.green}[${endpoint}] ${c.white}`;

// print event
const print_event = (action) => {
    console.log(`${c.green}worker[${wid}]${c.red}[API v.2]${c.cyan}[Event: ${c.yellow}${action}${c.cyan}]${c.white}`);
};

// io options API v.2
const io_opts = {
    serveClient: false, // (Boolean): whether to serve the client files
    // below are engine.IO options
    pingInterval: 10000, // (Number): how many ms without a pong packet to consider the connection closed
    pingTimeout: 5000, //(Number): how many ms before sending a new ping packet
    cookie: false,
};

/** check listId*/
const checkListId = (lid) => Object.values(config.list_type).includes(lid);

/** check block options.*/
const checkBlockOptions = (block, size, offset) => (block !== 0 ? check.normalize_pagination({ block: block }, size, offset) : false);

/** check size is undefined */
const checkNoSize = (size) => (!size ? true : false);
/** check offset is undefined or 0 */
const checkNoOffset = (offset) => (!offset && offset !== 0 ? true : false);

/*
// check addr is set, clear addr then check length
const checkAddr = (addr) => {
    if (addr === 0) return false;
    let clearAddr = check.cut0xClean(addr); // clear address
    return clearAddr.length === 40 // check cleared address length
        ? clearAddr
        : false;
};

// check hash
const checkHash = (hash) => {
    if (hash === 0) return false;
    let cHash = check.cut0xClean(hash); // clear hash
    return cHash.length === 64 // check cleared hash length
        ? cHash
        : false;
};*/

/** send msg to client*/
const emitMsg = (socket, event, msg) => socket.emit(event, JSON.stringify(msg));

/**
    emmit/log/event/error API v.2 wrapper
*/
const emit = async (event, socket, data, con_obj, err) => {
    log_event(event, data, con_obj); // log events
    // setup request params
    let options = {},
        response = {},
        { listId, moduleId, params, addr = 0, block, hash = 0 } = JSON.parse(data),
        { entityId = 0, size, offset } = params || {};

    // tx_opts = check.build_io_opts(params, listId, mod`uleId, entityId); // built tx options for GetlastTx
    switch (event) {
        case e.list: // event = 'list'
            switch (moduleId) {
                /* case m.tnx: // moduleId => transactions
                    switch (listId) {
                        case l.eth:
                            response = await tnx_controller.getTnx(tx_opts);
                            break;
                        default:
                            response = { error: 404, msg: 'Unknown listId' };
                    }
                    break;
                case m.token: // moduleId => tokens
                    switch (listId) {
                        case l.token:
                            response = await tnx_controller.getTnx(tx_opts);
                            break;
                        default:
                            response = { error: 404, msg: 'Unknown listId' };
                    }
                    break;*/
                case m.block: // moduleId => block
                    options = checkBlockOptions(entityId, size, offset);
                    if (options === false || checkListId(listId) === false) response = check.get_msg().wrong_io_params;
                    else if (checkNoSize(size)) response = check.get_msg().no_size;
                    else if (checkNoOffset(offset)) response = check.get_msg().no_offset;
                    else {
                        switch (listId) {
                            case l.token:
                                response = await block_controller.io_tokens(options);
                                break;
                            case l.eth:
                                response = await block_controller.io_eth(options);
                                break;
                            default:
                                response = check.get_msg().unknown_listid_io;
                        }
                    }
                    break;
                case m.addr: // moduleId => address
                    // clear address
                    let caddr = check.cut0xClean(entityId);
                    // check bad address
                    if (!check.checkAddr(caddr)) response = check.get_msg().wrong_addr;
                    else {
                        // construct normalized pagination object
                        options = check.normalize_pagination({ addr: caddr }, size, offset);
                        if (checkNoSize(size)) response = check.get_msg().no_size;
                        else if (checkNoOffset(offset)) response = check.get_msg().no_offset;
                        else if (checkListId(listId) === false) response = check.get_msg().wrong_io_params;
                        else {
                            switch (listId) {
                                case l.token:
                                    response = await addr_controller.io_tokens(options);
                                    break;
                                case l.eth:
                                    response = await addr_controller.io_eth(options);
                                    break;
                                case l.token_balance:
                                    response = await addr_controller.io_tokenBalance(options);
                                    break;
                                default:
                                    response = { error: 404, msg: 'Unknown listId' };
                            }
                            break;
                        }
                    }
                    break;
            }
            print_event(`${event} > ${moduleId} > ${listId}`);
            break;
        case e.addr_d: // get addr details event = 'addressDetails'
            print_event('socket.io > addressDetails');
            let caddr = check.cut0xClean(addr);
            response = check.checkAddr(caddr) ? await addr_controller.io_details(caddr) : check.get_msg().wrong_addr;
            break;
        case e.block_d: // get block details event = 'blockDetails'
            block = Number(block);
            print_event('socket.io > blockDetails');
            console.log({ block: block });
            response = isNaN(block) || block === 0 ? check.get_msg().wrong_block : await block_controller.io_details(block);
            break;
        // case e.tx_d: // get tnx details event = 'txDetails'
        //     let chash = checkHash(hash);
        //     console.log(`${c.green}===== socket.io > txDetails ========${c.yellow}`);
        //     console.log({ hash: hash, cleared_hash: chash });
        //     console.log(`${c.green}====================================${c.white}`);
        //     if (chash) {
        //         response = await tnx_controller.getTxIo(chash);
        //     } else {
        //         response = { error: 404, msg: 'Bad params' };
        //     }
        //     break;
        default:
            response = { errorCode: 404, errorMessage: 'Unknown moduleId' };
    }

    if (response.hasOwnProperty('errorCode')) err(response);
    else emitMsg(socket, event, response);
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

// init io handler API v.2
const init_io_handler = (io) => {
    io.on('connection', (socket) => {
        let err_log; // errors
        let con_obj = {
            client_ip: socket.handshake.address,
            url: socket.handshake.url,
            query: socket.handshake.query,
            sid: socket.client.id,
        };
        const e_wrapper = (event, data, error) => {
            if (typeof error === 'function') emit(event, socket, data, con_obj, error);
            else err_log = { error: '2nd argument is not a function', con_object: con_obj };
        };
        console.log(
            wid_ptrn(`client ${c.magenta}${socket.handshake.address}${c.green} connected to URL PATH ${c.magenta}${socket.handshake.url}${c.green}`)
        );

        /** socket.on(eventName, cb(arg1, arg2))
         *  arg1 = payload, arg2 = cb function(err){}
         * */
        /** 'blockDetails' event handler */
        socket.on(e.block_d, (data, err) => e_wrapper(e.block_d, data, err));
        /** 'addressDetails' event handler */
        socket.on(e.addr_d, (data, err) => e_wrapper(e.addr_d, data, err));
        /** 'txDetails' event handler */
        socket.on(e.tx_d, (data, err) => e_wrapper(e.tx_d, data, err));
        /** 'list' event handler */
        socket.on(e.list, (data, err) => e_wrapper(e.list, data, err));
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
