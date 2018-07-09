/* - REST API transaction block controller
*/
const block_model = require('../../models/block'),
      logger      = require('../../utils/logger')(module),
      moment      = require('moment'),
      check       = require('../../utils/checker').cheker(),
      cfg         = require('../../config/config');

// simple query logger
let logit = (req, msg = '') => {
  return {
    msg:              msg,
    post_params:      req.body,
    get_params:       req.query,
    timestamp:        (() => moment().format('DD.MM.YYYY HH:mm:ss'))(),
    path:             module.filename.split('/').slice(-2).join('/')
  }
};

// GetBlockTransactions from tnx_model
const GetBlockTnx = async ({ listId, moduleId, page, size, entityId } = opts, res) => {
  let options = check.safePageAndSize(page, size);
  options.listId    = listId;
  options.entityId  = entityId;
  try {
    let response = await block_model.blockTnxs(options);
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
        infinityScroll: 0,  // hardcoded
        listId:         listId,
        entityId:       entityId.toString(), // bug if its Number - FE wont render
        updateTime:     moment()
      };
      if(res) res.json(response);
      else return response
    } else {
      if(res) res.json(check.get_msg().not_found);
      else return check.get_msg().not_found
    }
  // handle exception from DB tnx_model
  } catch (e) {
    if(res) {
      res.status(500);
      res.json({ error: e }) // FWD exception to client
    }
    else return { error: e }
  }
};

// check block options (REST API). set moduleId = 'block'
const checkOptions = (req, res, listId = '', moduleId = 'block') => {
  logger.api_requests(logit(req));               // log query data any way
  if(listId.length > 0) { // check options for get block tnx Else check block param
    let { entityId = 0 } = req.body.params || {}; // if entityId not set or no params => entityId = 0 => then "error":"ModuleId not found"
    entityId = Number(entityId);       // convert to Number
    // check entityId from client
    return check.entityId(entityId, res)
      ? check.build_options(req, listId, moduleId, entityId)
      : false
  } else {
    let block = req.body.block || 0;
    block = Number(block);       // convert to Number
    return check.block(block, res)
      ? block
      : false
  }
};

// get block details
const GetBlock = async (block, res) => {
  try {
    let response = await block_model.getBlock(block);
    if(res) res.json(response);
    else return response
  } catch (e) {
    if(res){
      res.status(500);
      res.json({ error: e }) // FWD exception to client
    } else return { error: e }
  }
};

// Get block Tokens Transactions
const GetBlockTokens = (req, res) => {
 let options = checkOptions(req,res, cfg.list_type.token);
 if(options) GetBlockTnx(options, res)
};

// Get block ETH Transactions
const GetBlockEth = (req, res) => {
  let options = checkOptions(req,res, cfg.list_type.eth);
  if(options) GetBlockTnx(options, res)
};

// Get block details
const GetBlockDetails = (req, res) => {
  let block = checkOptions(req,res);
  if(block) GetBlock(block, res)
};



module.exports = {
  blockTokens:    GetBlockTokens,     // Get block Tokens Transactions endpoint [HTTP POST]
  blockEth:       GetBlockEth,        // Get block ETH Transactions endpoint    [HTTP POST]
  blockDetails:   GetBlockDetails,    // Get block details endpoint     [HTTP POST]
  getBlockTnx:    GetBlockTnx,        // for list API support
  getBlockIo:     GetBlock            // direct access (get block details socket IO + rest)
};
