/* - REST API v.1
 * transaction address controller
 */
const addr_model = require('../../models/v1/address'),
  logger = require('../../utils/logger')(module),
  moment = require('moment'),
  check = require('../../utils/checker').cheker(),
  cfg = require('../../config/config'),
  cluster = require('cluster'),
  c = cfg.color;

// worker id pattern
const wid_ptrn = (() => `${c.green}worker[${cluster.worker.id}]${c.cyan}[address controller][API v.1] ${c.white}`)();

// simple query logger
let logit = (req, msg = '') => {
  return {
    msg: msg,
    post_params: req.body,
    get_params: req.query,
    timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss'))(),
    path: module.filename.split('/').slice(-2).join('/')
  }
};


// common get address transaction func
const get_addr_tnxs = async (options, moduleId, listId, clearAddr) => {
  try{
    let response = await addr_model.addrTnxs(options);
    if(response.rows.length > 0){
      let { count, page, size, skip } = response;
      delete response.size;
      delete response.page;
      delete response.count;
      delete response.skip;
      response.head = {
        totalEntities: count,
        pageNumber: page,
        pageSize: size,
        skip: skip,
        moduleId: moduleId,
        listId: listId,
        entityId: clearAddr,
        updateTime: moment()
      };
      return response
    } else return check.get_msg().not_found
  } catch (e) {
    return { error: e }
  }
};

// common get address transaction func
const get_addr_token_balance = async (options, moduleId, listId) => {
  try{
    let response = await addr_model.addrTokenBalance(options);
    if(response.rows.length > 0){
      response.head.moduleId = moduleId;
      response.head.listId = listId;
      response.head.updateTime = moment();
      return response
    } else return check.get_msg().not_found
  } catch (e) {
    return { error: e }
  }
};

/* GetAddrTransactions from tnx_model (REST API + Socket IO)
 * if we have res object its REST request, otherwise its IO request
 */
const GetAddrTnx = async ({ listId, moduleId, page, size, entityId } = opts, res) => {
  console.log(`${wid_ptrn}`);
  let options = check.safePageAndSize(page, size); // build page, skip, size options
  options.listId = listId;                     // tx type (listOfETH/Tokens)
  options.entityId = entityId;                   // cleared address
  options.addr = entityId;                  // cleared address
  // get tnx db collection name by listId (IIFE + AF + ternary)
  options.collection = (listId => listId === 'listOfETH' ? 'ether_txn' : 'token_txn')(listId);
  logger.info({ addr: entityId });
  // if we have res object -> its REST API else ITS socket IO data
  if(res) res.json(await get_addr_tnxs(options, moduleId, listId, entityId));
  else return await get_addr_tnxs(options, moduleId, listId, entityId)
};

const GetAddrTokensBalance = async ({ listId, moduleId, skip, size, entityId } = opts, res) => {
  console.log(`${wid_ptrn}`);
  let options = { addr: entityId, skip: skip, size: size };
  logger.info(options);
  // if we have res object -> its REST API else ITS socket IO data
  if(res) res.json(await get_addr_token_balance(options, moduleId, listId));
  else return await get_addr_token_balance(options, moduleId, listId)
};

// check Address options (REST API). Set moduleId = 'address'
const checkOptions = (req, res, listId = '', moduleId = 'address') => {
  logger.api_requests(logit(req));               // log query data any way
  // if listId not passed then its addr details OR fail
  if(listId.length > 0){                       // check options
    let { entityId = 0 } = req.body.params || {}; // if entityId not set or no params => entityId = 0 => then "error":"entityId not found"
    // check entityId from client
    return check.entityId(entityId, res)
      ? check.build_options(req, listId, moduleId, entityId)
      : false
  } else { // if listId not passed then its Address details OR bad query
    let addr = req.body.addr || 0;
    console.log(addr);
    return check.addr(addr, res)
      ? addr
      : false
  }
};

// get Address details (REST API + Socket IO)
const GetAddr = async (address, res) => {
  console.log(`${wid_ptrn}`);
  try{
    let response = await addr_model.getAddr(address);
    if(!response.hasOwnProperty('head')) response = check.get_msg().not_found;
    // if we have res object -> its REST API else ITS socket IO data
    if(res) res.json(response);
    else return response
  } catch (e) {
    // if we have res object -> its REST API else ITS socket IO data
    if(res){
      res.status(500);
      res.json({ error: e }) // FWD exception to client
    } else return { error: e }
  }
};

// Get Address Tokens Transactions
const GetAddrTokens = (req, res) => {
  console.log(`${wid_ptrn}`);
  let options = checkOptions(req, res, cfg.list_type.token);
  if(options) GetAddrTnx(options, res)
};

// Get Address ETH Transactions
const GetAddrEth = (req, res) => {
  console.log(`${wid_ptrn}`);
  let options = checkOptions(req, res, cfg.list_type.eth);
  if(options) GetAddrTnx(options, res)
};

// Get Address details REST API
const GetAddrDetails = (req, res) => {
  console.log(`${wid_ptrn}`);
  let addr = req.body.addr;
  let c_addr = check.cut0xClean(addr) // cut 0x and clean address
  logger.info({ addr: addr, cleared_addr: c_addr });
  // check cleared address by length
  if(!check.checkAddr(c_addr, addr)) res.status(400).json(check.get_msg().bad_addr(addr))
  else GetAddr(c_addr, res)
};


module.exports = {
  addrDetails: GetAddrDetails,            // [HTTP REST] (API v.1) Get Address details REST API endpoint
  getAddrTnx: GetAddrTnx,                 // [socket.io] (API v.1) list
  getAddrIo: GetAddr,                     // [socket.io] (API v.1) address details
  addrTokensBalance: GetAddrTokensBalance // [socket.io] (API v.1) address token balance
};
