/*
 REST API v.2
 transaction controller
 */
const tnx_model = require('../../models/v2/transaction'),
    logger = require('../../utils/logger')(module),
    moment = require('moment'),
    check = require('../../utils/checker').cheker(),
    cfg = require('../../config/config'),
    cluster = require('cluster'),
    c = cfg.color;

// worker id pattern
const wid_ptrn = (endpoint) =>
    `${c.green}worker[${cluster.worker.id}]${c.red}[API v.2]${c.cyan}[transaction controller]${
        c.red
    } > ${c.green}[${endpoint}] ${c.white}`;

// simple query logger
let logit = (req, msg = '') => {
    return {
        msg: msg,
        post_params: req.body,
        get_params: req.query,
        timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss'))(),
        path: module.filename
            .split('/')
            .slice(-2)
            .join('/'),
    };
};

/*
// GetLastTransactions from tnx_model
const GetTnxRest = async ({ listId, moduleId, page, size } = opts, res) => {
  console.log(`${wid_ptrn}GetLastTransactions`);
  let options = check.safePageAndSize(page, size);
  options.listId = listId;
  logger.info(options);
  try{
    let response = await tnx_model.lastTransactions(options);
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
        updateTime: moment()
      };
      res.json(response);
    } else res.status(404).json(check.get_msg().not_found);
    // handle exception from DB tnx_model
  } catch (e) {
    res.status(400).json({ error: e }) // FWD exception to client
  }
};*/

const ChekHash = (clear_hash) =>
    new Promise((resolve, reject) => (check.checkHash(clear_hash) ? resolve() : reject()));

/*// GetLast Tokens Transactions endpoint [HTTP POST]
const GetLastTnxTokensRest = (req, res) => {
  logger.api_requests(logit(req));      // log query data any way
  // set params from cfg constants
  let listId = cfg.list_type.token, // listOfTokens
    moduleId = cfg.modules.tnx,     // transactions
    options = check.build_options(req, listId, moduleId);
  logger.info(options);                 // log options to console
  GetTnxRest(options, res)
};*/

/*
/!** [HTTP REST] (API v.2) GetLast ETH Transactions endpoint*!/
const GetLastTnxEthRest = async (req, res) => {
  logger.api_requests(logit(req));      // log query data any way
  // set params from cfg constants
  let listId = cfg.list_type.eth,   // listOfETH
    moduleId = cfg.modules.tnx,     // transactions
    options = check.build_options(req, listId, moduleId);
  logger.info(options);                 // log options to console
  GetTnxRest(options, res)
};*/

/** common tx details*/
const txDetails = async (hash) => {
    console.log(`${wid_ptrn}Get tx "0x${hash}" details`);
    try {
        let response = await tnx_model.details(hash); // get tx details by hash
        return response.hasOwnProperty('empty') ? check.get_msg().transaction_not_found : response;
    } catch (e) {
        logger.error(e); // log exception
        return check.get_msg().transaction_not_found;
    }
};

/** Get Transaction details endpoint API v.2*/
const GetTnxDetailsRest = async (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    console.log(`${wid_ptrn('GetTnxDetailsRest')}`);
    let hash = req.query.hash;
    let clear_hash = check.cut0xClean(hash);
    ChekHash(clear_hash)
        .then(async () => {
            let response = await txDetails(clear_hash);
            if (response.hasOwnProperty('errorCode')) res.status(404);
            res.json(response);
        })
        .catch(() => res.status(400).json(check.get_msg().bad_hash(hash)));
};

/*
// count TNXS
const CountTnxRest = async (req, res) =>
    logger.api_requests(logit(req)) && // log query any way
    res.json(await dbquery.countTnx(Object.values(cfg.store.cols))); // fwd data to model => count all
*/

module.exports = {
    // tokens: GetLastTnxTokensRest,  // [HTTP REST] (API v.2) GetLast Tokens Transactions endpoint
    // eth: GetLastTnxEthRest,        // [HTTP REST] (API v.2) GetLast ETH Transactions endpoint
    details: GetTnxDetailsRest, // [HTTP REST] (API v.2) Get Transaction details endpoint
    // count: CountTnxRest,           // [HTTP REST] (API v.2) count TNXS
};
