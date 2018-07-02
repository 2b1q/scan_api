// socket.io controller
const config = require('../config/config'),
      c      = config.color,
      e      = config.events.client, // socket IO client events
      logger = require('../utils/logger')(module),
      moment = require('moment'),
      check  = require('../utils/checker').cheker(),
      tnx_controller = require('./transaction'),
      block_controller = require('./block'),
      addr_controller = require('./address');

// log Event
const log_event = (event, data, con_obj) => logger.socket_requests(
  {
    event: event,
    data: JSON.parse(data),
    timestamp: moment().format('DD.MM.YYYY HH:mm:ss'),
    connected_obj: con_obj
  })

// check block/address options.
const checkOptions = (listId, moduleId, entityId, params) =>
  entityId !== 0
    ? check.build_io_opts(params, listId, moduleId, entityId)
    : false

// check addr is set, clear addr then check length
const checkAddr = addr => {
  if( addr === 0 ) return false
  let clearAddr = check.cut0xClean(addr);      // clear address
  return clearAddr.length === 40
        ? clearAddr
        : false
}

// send msg to client
const emitMsg = (socket, msg) => socket.emit(msg)

// emmit/log/event wrapper
const emit = async (event, socket, data, con_obj) => {
  log_event(event, data, con_obj)
  // setup request params
  let options = {},
      response = {},
      { listId, moduleId, params, addr = 0 } = JSON.parse(data),
      { entityId = 0 } = params || {};
  switch (event) {
    case e.list:
      options = checkOptions(listId, moduleId, entityId, params)
      emitMsg(socket, (options === false)
        ? { Error: 'bad params', params: data }
        : await addr_controller.getAddrTnx(options)
      )
      break;
    case e.addr_d: // get addr details
      let caddr = checkAddr(addr)
      emitMsg(socket, (caddr === false)
        ? check.get_msg().bad_addr
        : await addr_controller.getAddrIo(caddr)
      )
    default:
      emitMsg(socket, 'Unknown event')
  }
}

// init io handler
const init_io_handler = io => {
  io.on('connection', socket =>{
    let con_obj = {
      client_ip:  socket.handshake.address,
      url:        socket.handshake.url,
      query:      socket.handshake.query,
      sid:        socket.client.id
    }
    socket.on('disconnection', data => log_event('disconnection', data, con_obj))

    socket.on(e.list, data => emit(e.list, socket, data, con_obj))
    socket.on(e.tx_d, data => emit(e.tx_d, socket, data, con_obj))
    socket.on(e.block_d, data => emit(e.block_d, socket, data, con_obj))
    socket.on(e.addr_d, data => emit(e.addr_d, socket, data, con_obj))
  })
}

// init socket.io middleware
const init_io = server => init_io_handler(require('socket.io')(server))

module.exports = init_io
