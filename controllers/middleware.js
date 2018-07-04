// socket.io controller
const config = require('../config/config'),
      c      = config.color,
      e      = config.events.client, // socket IO client events
      m      = config.modules,  // modules
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

// rand str 10 chars
const randstr = () => Math.random().toString(36).substring(2, 12)

// check block/address options.
const checkOptions = (listId, moduleId, entityId, params) =>
  entityId !== 0
    ? check.build_io_opts(params, listId, moduleId, entityId)
    : false

// check addr is set, clear addr then check length
const checkAddr = addr => {
  if( addr === 0 ) return false
  let clearAddr = check.cut0xClean(addr); // clear address
  return clearAddr.length === 40          // check cleared address length
        ? clearAddr
        : false
}

// check hash
const checkHash = hash => {
  if( hash === 0 ) return false
  let cHash = check.cut0xClean(hash); // clear hash
  return cHash.length === 64          // check cleared hash length
    ? cHash
    : false
}

// send msg to client
const emitMsg = (socket, event, msg) => socket.emit(event, JSON.stringify(msg))

// emmit/log/event wrapper
const emit = async (event, socket, data, con_obj) => {
  log_event(event, data, con_obj) // log events
  // setup request params
  let options = {},
      response = {},
      { listId, moduleId, params, addr = 0, block, hash = 0 } = JSON.parse(data),
      { entityId = 0 } = params || {},
      tx_opts = check.build_io_opts(params, listId, moduleId, entityId); // buil tx options for GetlastTx
  switch (event) {
    case e.list: // event = 'list'
      options = checkOptions(listId, moduleId, entityId, params)
      switch (moduleId) {
        case m.tnx: // moduleId => transactions
          emitMsg(socket, event, await tnx_controller.getTnx(tx_opts))
          break;
        case m.token: // moduleId => tokens
          emitMsg(socket, event, await tnx_controller.getTnx(tx_opts))
          break;
        case m.block: // moduleId => block
          emitMsg(socket, event,
            (options === false)
              ? { Error: 'bad params', params: data }
              : await block_controller.getBlockTnx(options)
          )
          break;
        case m.addr: // moduleId => address
          emitMsg(socket, event,
            (options === false)
              ? { Error: 'bad params', params: data }
              : await addr_controller.getAddrTnx(options)
          )
          break;
        default: emitMsg(socket, event, 'Unknown ModuleId')
      }
      console.log(`${c.green}=socket.io > ${event} > ${moduleId} =`);
      if(options) console.log(`${c.yellow}${JSON.stringify(options,null,2)}`);
      console.log(`${c.green}====================================${c.white}`);
      break;
    case e.addr_d: // get addr details event = 'addressDetails'
      let caddr = checkAddr(addr)
      console.log(`${c.green}===== socket.io > addressDetails ===${c.yellow}`);
      console.log({ addr: addr, cleared_addr: caddr });
      // console.log(await addr_controller.getAddrIo(caddr)); DEBUG
      /*
      ===== socket.io > addressDetails ===
{ addr: '99e793f74ebeda76005a83396e63493f7f26f4a2',
  cleared_addr: '99e793f74ebeda76005a83396e63493f7f26f4a2' }
connection not open on send()
{ error: Error: connection not open
    at WebsocketProvider.send (/home/bbq/BANKEX/playground/dev/bkx-scan-api/node_modules/web3-providers-ws/src/index.js:247:18)
      */
      console.log(`${c.green}====================================${c.white}`);
      emitMsg(socket, event, (caddr === false)
        ? check.get_msg().bad_addr
        : await addr_controller.getAddrIo(caddr)
      )
      break;
    case e.block_d: // get block details event = 'blockDetails'
      if(block) {
        block = Number (parseInt(block))
        emitMsg(socket, event, await block_controller.getBlockIo(block))
      } else emitMsg(socket, event, {Error: 'Wrong block'})
      console.log(`${c.green}===== socket.io > blockDetails =====${c.yellow}`);
      console.log({ block: block });
      console.log(`${c.green}====================================${c.white}`);
      break;
    case e.tx_d: // get tnx details event = 'txDetails'
      let chash = checkHash(hash)
      emitMsg(socket, event, (chash === false)
        ? check.get_msg().bad_hash(hash)
        : await tnx_controller.getTxIo(chash)
      )
      console.log(`${c.green}===== socket.io > txDetails ========${c.yellow}`);
      console.log({ hash: hash, cleared_hash: chash });
      console.log(`${c.green}====================================${c.white}`);
      break;
    default:
      emitMsg(socket, event, 'Unknown event')
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
    socket.join(randstr()) // it works without join

    socket.on(e.list, data => emit(e.list, socket, data, con_obj))
    socket.on(e.tx_d, data => emit(e.tx_d, socket, data, con_obj))
    socket.on(e.block_d, data => emit(e.block_d, socket, data, con_obj))
    socket.on(e.addr_d, data => emit(e.addr_d, socket, data, con_obj))

    socket.on('disconnection', data => log_event('disconnection', data, con_obj))
  })
}

// init socket.io middleware
const init_io = server => init_io_handler(require('socket.io')(server))

module.exports = init_io
