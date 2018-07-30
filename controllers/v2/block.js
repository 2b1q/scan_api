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

// GetBlockTransactions from tnx_model
const GetBlockTnx = async ({ listId, moduleId, page, size, entityId } = opts, res) => {
  console.log(`${wid_ptrn}`)
  let options = check.safePageAndSize(page, size);
  options.listId = listId;
  options.entityId = entityId;
  try{
    let response = await block_model.transactions(options);
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
        infinityScroll: 0,  // hardcoded
        listId: listId,
        entityId: entityId.toString(), // bug if its Number - FE wont render
        updateTime: moment()
      };
      if(res) res.json(response);
      else return response
    } else {
      if(res) res.status(404).json(check.get_msg().not_found);
      else return check.get_msg().not_found
    }
    // handle exception from DB tnx_model
  } catch (e) {
    if(res) res.status(400).json({ error: e }) // FWD exception to client
    else return { error: e }
  }
};

// check block options (REST API). set moduleId = 'block'
const checkOptions = (req, listId = '', moduleId = 'block') => {
  logger.api_requests(logit(req));               // log query data any way
  if(listId.length > 0){ // check options for get block tnx Else check block param
    let { block = 0 } = req.body.params || {}; // if entityId not set or no params => entityId = 0 => then "error":"ModuleId not found"
    block = Number(parseInt(block));       // convert to Number
    // check entityId from client
    return check.block(block)
      ? check.build_options(req, listId, moduleId, block)
      : false
  } else {
    let block = req.body.block || 0;
    block = Number(parseInt(block));       // convert to Number
    return check.block(block)
      ? block
      : false
  }
};

// get block details
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

// Get block Tokens Transactions
const GetBlockTokens = (req, res) => {
  // let options = checkOptions(req, res, cfg.list_type.token);
  if(options) GetBlockTnx(options, res)
};

// Get block ETH Transactions API v.2
const GetBlockEth = (req, res) => {
  let params = req.body.params || {}
  // params destructing
  let { blockNumber, pageNumber, pageSize } = params;
  if(!pageNumber) res.status(400).json(check.get_msg().no_pageNumber)
  else if(!pageSize) res.status(400).json(check.get_msg().no_pageSize)
  else if(!blockNumber) res.status(400).json(check.get_msg().no_blockNumber)
  let block = Number(parseInt(blockNumber));  // convert to Number
  pageSize = Number(parseInt(pageSize));      // convert to Number
  pageNumber = Number(parseInt(pageNumber));  // convert to Number
  if(check.block(block)){
    let options = check.build_block_opts(block, pageSize, pageNumber) // TODO
    res.json(options)
    // http_GetBlockTnx(options, res);
  } else res.status(400).json(check.get_msg().wrong_block)
};

// Get block details API v.2
const GetBlockDetails = (req, res) => {
  let block = req.body.block || 0;
  if(check.block(block)) http_GetBlock(block, res);
  else res.status(400).json(check.get_msg().wrong_block)
};


module.exports = {
  tokens: GetBlockTokens,      // [HTTP REST] (API v.2) Get block Tokens Transactions endpoint
  eth: GetBlockEth,            // [HTTP REST] (API v.2) Get block ETH Transactions endpoint
  details: GetBlockDetails,    // [HTTP REST] (API v.2) Get block details endpoint
};
