// socket.io controller
const config = require("../config/config"),
  c = config.color,
  e = config.events.client, // socket IO client events
  m = config.modules, // modules
  l = config.list_type, // modules
  logger = require("../utils/logger")(module),
  moment = require("moment"),
  check = require("../utils/checker").cheker(),
  tnx_controller = require("../controllers/v1/transaction"),
  block_controller = require("../controllers/v1/block"),
  addr_controller = require("../controllers/v1/address");

// log Event
const log_event = (event, data, con_obj) =>
  logger.socket_requests({
    event: event,
    data: JSON.parse(data),
    timestamp: moment().format("DD.MM.YYYY HH:mm:ss"),
    connected_obj: con_obj
  });

// rand str 10 chars
const randstr = () =>
  Math.random()
    .toString(36)
    .substring(2, 12);

// check block/address options.
const checkOptions = (listId, moduleId, entityId, params) =>
  entityId !== 0
    ? check.build_io_opts(params, listId, moduleId, entityId)
    : false;

// check addr is set, clear addr then check length
const checkAddr = addr => {
  if (addr === 0) return false;
  let clearAddr = check.cut0xClean(addr); // clear address
  return clearAddr.length === 40 // check cleared address length
    ? clearAddr
    : false;
};

// check hash
const checkHash = hash => {
  if (hash === 0) return false;
  let cHash = check.cut0xClean(hash); // clear hash
  return cHash.length === 64 // check cleared hash length
    ? cHash
    : false;
};

// send msg to client
const emitMsg = (socket, event, msg) => socket.emit(event, JSON.stringify(msg));

// emmit/log/event/error wrapper
const emit = async (event, socket, data, con_obj, err) => {
  log_event(event, data, con_obj); // log events
  // setup request params
  let options = {},
    response = {},
    { listId, moduleId, params, addr = 0, block, hash = 0 } = JSON.parse(data),
    { entityId = 0 } = params || {},
    tx_opts = check.build_io_opts(params, listId, moduleId, entityId); // built tx options for GetlastTx
  switch (event) {
    case e.list: // event = 'list'
      options = checkOptions(listId, moduleId, entityId, params);
      switch (moduleId) {
        case m.tnx: // moduleId => transactions
          switch (listId) {
            case l.eth:
              response = await tnx_controller.getTnx(tx_opts);
              break;
            default:
              response = { error: 404, msg: "Unknown listId" };
          }
          break;
        case m.token: // moduleId => tokens
          switch (listId) {
            case l.token:
              response = await tnx_controller.getTnx(tx_opts);
              break;
            default:
              response = { error: 404, msg: "Unknown listId" };
          }
          break;
        case m.block: // moduleId => block
          if (options === false || isNaN(entityId)) {
            response = { error: 404, msg: "Bad params" };
          } else {
            switch (listId) {
              case l.token:
              case l.eth:
                response = await block_controller.getBlockTnx(options);
                break;
              default:
                response = { error: 404, msg: "Unknown listId" };
            }
          }
          break;
        case m.addr: // moduleId => address
          options.entityId = checkAddr(entityId);
          if (options.entityId === false) {
            response = { error: 404, msg: "Bad params" };
          } else {
            switch (listId) {
              case l.token:
              case l.eth:
                response = await addr_controller.getAddrTnx(options);
                break;
              case l.token_balance:
                response = await addr_controller.addrTokensBalance(options);
                break;
              default:
                response = { error: 404, msg: "Unknown listId" };
            }
            break;
          }
      }
      console.log(
        `${c.green}=socket.io > ${event} > ${moduleId} > ${listId} =`
      );
      if (options)
        console.log(`${c.yellow}${JSON.stringify(options, null, 2)}`);
      console.log(`${c.green}====================================${c.white}`);
      break;
    case e.addr_d: // get addr details event = 'addressDetails'
      let caddr = checkAddr(addr);
      console.log(`${c.green}===== socket.io > addressDetails ===${c.yellow}`);
      console.log({ addr: addr, cleared_addr: caddr });
      console.log(`${c.green}====================================${c.white}`);
      if (caddr === false) {
        response = { error: 404, msg: "Bad params" };
      } else {
        response = await addr_controller.getAddrIo(caddr);
      }
      break;
    case e.block_d: // get block details event = 'blockDetails'
      block = Number(block);
      console.log(`${c.green}===== socket.io > blockDetails =====${c.yellow}`);
      console.log({ block: block });
      console.log(`${c.green}====================================${c.white}`);
      if (isNaN(block)) {
        response = { error: 404, msg: "Bad params" };
      } else {
        response = await block_controller.getBlockIo(block);
      }
      break;
    case e.tx_d: // get tnx details event = 'txDetails'
      let chash = checkHash(hash);
      console.log(`${c.green}===== socket.io > txDetails ========${c.yellow}`);
      console.log({ hash: hash, cleared_hash: chash });
      console.log(`${c.green}====================================${c.white}`);
      if (chash) {
        response = await tnx_controller.getTxIo(chash);
      } else {
        response = { error: 404, msg: "Bad params" };
      }
      break;
    default:
      response = { error: 404, msg: "Unknown moduleId" };
  }

  if (response.hasOwnProperty("error")) err(response);
  else emitMsg(socket, event, response);
};

// init io handler
const init_io_handler = io => {
  io.on("connection", socket => {
    let con_obj = {
      client_ip: socket.handshake.address,
      url: socket.handshake.url,
      query: socket.handshake.query,
      sid: socket.client.id
    };
    socket.join(randstr()); // it works without join

    socket.on(e.list, (data, err) => emit(e.list, socket, data, con_obj, err));
    socket.on(e.tx_d, (data, err) => emit(e.tx_d, socket, data, con_obj, err));
    socket.on(e.block_d, (data, err) =>
      emit(e.block_d, socket, data, con_obj, err)
    );
    socket.on(e.addr_d, (data, err) =>
      emit(e.addr_d, socket, data, con_obj, err)
    );

    socket.on("disconnection", data =>
      log_event("disconnection", data, con_obj)
    );
    socket.on("error", error => {
      console.log(error);
    });
  });
};

// init socket.io middleware
const init_io = server => init_io_handler(require("socket.io")(server));

module.exports = init_io;
