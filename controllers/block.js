/* - REST API transaction block controller
*/
const block_model = require('../models/block'),
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

// GetBlockTransactions from tnx_model
const GetBlockTnx = async ({ listId, moduleId, page, size, entityId } = opts, res) => {
  let options = check.safePageAndSize(page, size)
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
        listId:         listId,
        entityId:       entityId,
        updateTime:     moment()
      }
      res.json(response)
    } else {
      res.json(check.get_msg().not_found)
    }
  // handle exception from DB tnx_model
  } catch (e) {
    res.status(500)
    res.json({ error: e }) // FWD exception to client
  }
}

// Get block Tokens Transactions endpoint [HTTP POST]
const GetBlockTokens = (req, res) => {
  logger.api_requests(logit(req))               // log query data any way
  let { entityId = 0 } = req.body.params || {}; // if entityId not set or no params => entityId = 0 => then "error":"ModuleId not found"
  entityId = Number( parseInt(entityId) )       // parse any value and convert to Number
  // check entityId from client
  if(check.entityId(entityId, res)) {
    // set params from cfg constants
    let listId    = cfg.list_type.token,        // listOfTokens
        moduleId  = cfg.modules.block,          // block
        options   = check.build_options(req, listId, moduleId, entityId)
    GetBlockTnx(options, res)
  }
}


const GetBlockEth = (req, res) => {
  logger.api_requests(logit(req))               // log query data any way
  let { entityId = 0 } = req.body.params || {}; // if entityId not set or no params => entityId = 0 => then "error":"ModuleId not found"
  entityId = Number( parseInt(entityId) )       // parse any value and convert to Number
  // check entityId from client
  if(check.entityId(entityId, res)) {
    // set params from cfg constants
    let listId    = cfg.list_type.eth,          // listOfETH
        moduleId  = cfg.modules.block,          // block
        options   = check.build_options(req, listId, moduleId, entityId)
    GetBlockTnx(options, res)
  }
}
const GetBlockDetails = (req, res) => {}



module.exports = {
  blockTokens:    GetBlockTokens,     // Get block Tokens Transactions endpoint [HTTP POST]
  blockEth:       GetBlockEth,        // Get block ETH Transactions endpoint    [HTTP POST]
  blockDetails:   GetBlockDetails     // Get block details endpoint     [HTTP POST]
};
