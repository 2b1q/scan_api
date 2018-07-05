/* - REST API transaction address controller
*/
const addr_model = require('../models/address'),
      logger      = require('../utils/logger')(module),
      moment      = require('moment'),
      check       = require('../utils/checker').cheker(),
      cfg         = require('../config/config');

// simple query logger
let logit = (req, msg = '') => {
  return {
    msg:              msg,
    post_params:      req.body,
    get_params:       req.query,
    timestamp:        (() => moment().format('DD.MM.YYYY HH:mm:ss'))(),
    path:             module.filename.split('/').slice(-2).join('/')
  }
}

// check address format
const ChekAddr = (clearAddr, entityId, res) => new Promise(resolve =>
  check.checkAddr(clearAddr, entityId, res)
    ? resolve(true)
    : resolve(false)
);

// common get address transaction func
const get_addr_tnxs = async (options, moduleId, listId, clearAddr) => {
  try {
    let response = await addr_model.addrTnxs(options);
    if(response.rows.length > 0) {
      let { count, page, size, skip } = response;
      delete response.size;
      delete response.page;
      delete response.count;
      delete response.skip;
      response.head = {
        totalEntities:  count,
        pageNumber:     page,
        pageSize:       size,
        skip:           skip,
        moduleId:       moduleId,
        listId:         listId,
        entityId:       clearAddr,
        updateTime:     moment()
      }
      return response
    } else  return check.get_msg().not_found
  } catch (e) {
    return { error: e }
  }
}

/* GetAddrTransactions from tnx_model (REST API + Socket IO)
* if we have res object its REST request, otherwise its IO request
*/
const GetAddrTnx = async ({ listId, moduleId, page, size, entityId } = opts, res) => {
  let options = check.safePageAndSize(page, size)  // build page, skip, size options
  let clearAddr = check.cut0xClean(entityId);      // clear address
  options.listId     = listId;                     // tx type (listOfETH/Tokens)
  options.entityId   = entityId;                   // not cleared address (AS IS from client)
  options.addr       = clearAddr;                  // cleared address
  // get tnx db collection name by listId (IIFE + AF + ternary)
  options.collection = (listId => listId ==='listOfETH' ? 'ether_txn':'token_txn')(listId)
  logger.info({addr: entityId, cleared_addr: clearAddr})
  // if we have res object -> its REST API else ITS socket IO data
  if(res) ChekAddr(clearAddr, entityId, res)
            .then(async result => {
              if(result) res.json(await get_addr_tnxs(options, moduleId, listId, clearAddr))
              else console.log(`result status is ${result}`);
            })
  // ITS socket IO data
  else return await get_addr_tnxs(options, moduleId, listId, clearAddr)
}

// check Address options (REST API). Set moduleId = 'address'
const checkOptions = (req, res, listId = '', moduleId = 'address' ) => {
  logger.api_requests(logit(req))               // log query data any way
  // if listId not passed then its addr details OR fail
  if(listId.length > 0) {                       // check options
    let { entityId = 0 } = req.body.params || {}; // if entityId not set or no params => entityId = 0 => then "error":"entityId not found"
    // check entityId from client
    return check.entityId(entityId, res)
      ? check.build_options(req, listId, moduleId, entityId)
      : false
  } else { // if listId not passed then its Address details OR bad query
    let addr = req.body.addr || 0;
    return check.addr(addr, res)
      ? addr
      : false
  }
}

// get Address details (REST API + Socket IO)
const GetAddr = async (address, res) => {
  try {
    let response = await addr_model.getAddr(address)
    if(!response.hasOwnProperty('head')) response = check.get_msg().not_found
    // if we have res object -> its REST API else ITS socket IO data
    if(res) res.json(response)
    else return response
  } catch (e) {
    // if we have res object -> its REST API else ITS socket IO data
    if(res) {
      res.status(500)
      res.json({ error: e }) // FWD exception to client
    } else return { error: e }
  }
}

// Get Address Tokens Transactions
const GetAddrTokens = (req, res) => {
 let options = checkOptions(req,res, cfg.list_type.token)
 if(options) GetAddrTnx(options, res)
}

// Get Address ETH Transactions
const GetAddrEth = (req, res) => {
  let options = checkOptions(req,res, cfg.list_type.eth)
  if(options) GetAddrTnx(options, res)
}

// Get Address details
const GetAddrkDetails = (req, res) => {
  let addr = checkOptions(req,res)
  if(addr) {
    let clearAddr = check.cut0xClean(addr);      // clear address
    logger.info({addr: addr, cleared_addr: clearAddr})
    if(check.checkAddr(clearAddr, addr, res)) GetAddr(clearAddr, res)

  }
}



module.exports = {
  addrTokens:    GetAddrTokens,     // Get Address Tokens Transactions endpoint [HTTP POST]
  addrEth:       GetAddrEth,        // Get Address ETH Transactions endpoint    [HTTP POST]
  addrDetails:   GetAddrkDetails,   // Get Address details endpoint     [HTTP POST]
  getAddrTnx:    GetAddrTnx,        // list API support (address transactions)
  getAddrIo:     GetAddr            // address details - direct support (REST API + Socket IO)
};
