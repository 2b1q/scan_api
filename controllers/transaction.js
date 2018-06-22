/*
- REST API transaction controller
*/
const tnx_model = require('../models/transaction'),
      logger = require('../utils/logger')(module),
      moment = require('moment'),
      check = require('../utils/checker').cheker(),
      cfg = require('../config/config');

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

// GetLastTransactions from tnx_model
const GetTnx = async ({ ListId, ModuleId, page, size } = opts, res) => {
  let options = check.safePageAndSize(page, size)
  options.ListId = ListId;
  try {
    let response = await tnx_model.getLastTnxs(options);
    if(response.Rows.length > 0) {
      let { count, page, size } = response;
      delete response.size
      delete response.page
      delete response.count;
      response.Head = {
        TotalEntities:  count,
        PageNumber:     page,
        PageSize:       size,
        ModuleId:       ModuleId,
        ListId:         ListId,
        UpdateTime:     moment()
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

/* ChekListId Promise (use it to check ListId param)
* e.g. check ListId then GetTnx (use it in IO requests)
* ChekListId(ListId, res)
*  .then(() => GetTnx(options, res))
*/
const ChekListId = (ListId, res) => new Promise((resolve) =>
  check.listId(ListId, res)
    ? resolve()
    : false
);

// GetLast Tokens Transactions endpoint [HTTP POST]
const GetLastTnxTokens = (req, res) => {
  logger.api_requests(logit(req)) // log query any way
  // set params from cfg constants
  let ListId    =  cfg.list_type.token, // listOfTokens
      ModuleId  =  cfg.modules.tnx;     // transactions
  let options = check.build_options(req, ListId, ModuleId)
  logger.info(options)
  GetTnx(options, res)
}

// GetLast ETH Transactions
const GetLastTnxEth = async (req, res) => {
  logger.api_requests(logit(req))       // log query any way
  // set params from cfg constants
  let ListId    =  cfg.list_type.eth,   // listOfETH
      ModuleId  =  cfg.modules.tnx;     // transactions
  let options = check.build_options(req, ListId, ModuleId)
  logger.info(options)
  GetTnx(options, res)
}

// Get Transaction details endpoint
const GetTnxDetails = async (req, res) => {}

// count TNXS by req.query.ListId type
const CountTnx = async (req, res) =>
  logger.api_requests(logit(req))                                   // log query any way
  && check.listId(req.query.ListId, res)                            // check listId
  && res.json({ tnx: await tnx_model.countTnx(req.query.ListId) })  // fwd data to model => count tnx by listId type

module.exports = {
  lastTnxTokens: GetLastTnxTokens,  // GetLast Tokens Transactions endpoint [HTTP POST]
  lastTnxEth: GetLastTnxEth,        // GetLast ETH Transactions endpoint    [HTTP POST]
  TnxDetails: GetTnxDetails,        // Get Transaction details endpoint     [HTTP POST]
  countTnx: CountTnx                // count TNXS by req.query.ListId type  [HTTP GET]
};
