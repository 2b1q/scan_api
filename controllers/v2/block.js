/* REST API v.2
 block controller
 */
const block_model = require('../../models/v2/block'),
  logger = require('../../utils/logger')(module),
  moment = require('moment'),
  check = require('../../utils/checker').cheker(),
  cfg = require('../../config/config'),
  cluster = require('cluster'),
  c = cfg.color;

// worker id pattern
const wid_ptrn = (() => `${c.green}worker[${cluster.worker.id}]${c.cyan}[block controller][API v.2] ${c.white}`)();

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

// get block details API v.2
const http_GetBlock = async (block, res) => {
  console.log(`${wid_ptrn}`)
  try{
    let response = await block_model.details(block);
    if(response.hasOwnProperty('error')) res.status(404); // if Not Found -> change HTTP Status code
    res.json(response); // send 200 with data OR 404 if not found
  } catch (e) {
    res.status(400).json({ error: e }) // FWD exception to client
  }
};

// check options function (getBlock ETH/Tokens)
const checkBlockParams = (req, res) => {
  console.log(`${wid_ptrn}`)
  // log query data any way
  logger.api_requests(logit(req));
  let params = req.body.params || {}
  // params destructing
  let { blockNumber, pageNumber, pageSize, offset, count } = params; // TODO add offset & count support for iOS pagination
  // check params existing
  if(!pageNumber){
    res.status(400).json(check.get_msg().no_pageNumber)
    return false
  }
  else if(!pageSize){
    res.status(400).json(check.get_msg().no_pageSize)
    return false
  }
  else if(!blockNumber){
    res.status(400).json(check.get_msg().no_blockNumber)
    return false
  }
  let block = Number(parseInt(blockNumber));  // convert to Number
  if(check.block(block)){
    pageSize = Number(parseInt(pageSize));      // convert to Number
    pageNumber = Number(parseInt(pageNumber));  // convert to Number
    return check.build_block_opts(block, pageSize, pageNumber) // return options object
  } else {
    res.status(400).json(check.get_msg().wrong_block)
    return false
  }
}

// Get block ETH Transactions API v.2
const GetBlockEth = async (req, res) => {
  let options = checkBlockParams(req, res);
  if(options){
    // add eth collection property
    options.collection = cfg.store.cols.eth
    // get ether collection name
    let response = await block_model.transactions(options);
    if(response){
      // preparing data (map data from model)
      response.head.updateTime = moment(); // UTC time format
      response.rows = response.rows.map(tx => {
        return {
          id: tx._id,
          hash: tx.hash,
          block: tx.block,
          addrFrom: tx.addrfrom,
          addrTo: tx.addrto,
          isoTime: tx.isotime,
          type: tx.type,
          status: tx.status,
          error: tx.error,
          isContract: tx.iscontract,
          isInner: tx.isinner,
          value: tx.value,
          txFee: tx.txfee,
          dcm: tx.tokendcm,
          gasUsed: tx.gasused,
          gasCost: tx.gascost
        }
      })
      res.json(response)
    }
    else res.json(check.get_msg().not_found)
  }
};

// Get block Tokens Transactions API v.2
const GetBlockTokens = async (req, res) => {
  let options = checkBlockParams(req, res);
  if(options){
    // add tokens collection property
    options.collection = cfg.store.cols.token
    // get tokens collection name
    let response = await block_model.transactions(options);
    if(response){
      // preparing data (map data from model)
      response.head.updateTime = moment(); // UTC time format
      response.rows = response.rows.map(tx => {
        return {
          id: tx._id,
          hash: tx.hash,
          block: tx.block,
          addrFrom: tx.addrfrom,
          addrTo: tx.addrto,
          isoTime: tx.isotime,
          type: tx.type,
          status: tx.status,
          error: tx.error,
          isContract: tx.iscontract,
          isInner: tx.isinner,
          value: tx.value,
          tokenAddr: tx.tokenaddr,
          tokenName: tx.tokenname,
          tokenSmbl: tx.tokensmbl,
          tokenDcm: tx.tokendcm,
          tokenType: tx.tokentype,
          txFee: tx.txfee,
          dcm: tx.tokendcm,
          gasUsed: tx.gasused,
          gasCost: tx.gascost
        }
      })
      res.json(response)
    }
    else res.json(check.get_msg().not_found)
  }
};

// Get block details API v.2
const GetBlockDetails = (req, res) => {
  logger.api_requests(logit(req));               // log query data any way
  let block = req.body.block || 0;
  if(check.block(block)) http_GetBlock(block, res);
  else res.status(400).json(check.get_msg().wrong_block)
};

module.exports = {
  tokens: GetBlockTokens,      // [HTTP REST] (API v.2) Get block Tokens Transactions endpoint
  eth: GetBlockEth,            // [HTTP REST] (API v.2) Get block ETH Transactions endpoint
  details: GetBlockDetails,    // [HTTP REST] (API v.2) Get block details endpoint
};
