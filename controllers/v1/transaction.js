/*
 - REST API v.1
 transaction controller
 */
const tnx_model = require('../../models/v1/transaction'),
  dbquery = require('../../models/v1/db_query'),
  logger = require('../../utils/logger')(module),
  moment = require('moment'),
  check = require('../../utils/checker').cheker(),
  cfg = require('../../config/config'),
  cluster = require('cluster'),
  c = cfg.color;

// worker id pattern
const wid_ptrn = (() => `${c.green}worker[${cluster.worker.id}]${c.cyan}[transaction controller][API v.1] ${c.white}`)();

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

// GetLastTransactions from tnx_model
const GetTnx = async ({ listId, moduleId, page, size } = opts, res) => {
  console.log(`${wid_ptrn}GetLastTransactions`);
  let options = check.safePageAndSize(page, size);
  options.listId = listId;
  logger.info(options);
  try{
    let response = await tnx_model.getLastTnxs(options);
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
      // if we have res object -> its REST API else ITS socket IO data
      if(res) res.json(response);
      else return response
    } else {
      // if we have res object -> its REST API else ITS socket IO data
      if(res) res.json(check.get_msg().not_found);
      else return check.get_msg().not_found
    }
    // handle exception from DB tnx_model
  } catch (e) {
    // if we have res object -> its REST API else ITS socket IO data
    if(res){
      res.status(500);
      res.json({ error: e }) // FWD exception to client
    } else return { error: e }
  }
};


const ChekHash = clear_hash => new Promise((resolve, reject) =>
  check.checkHash(clear_hash)
    ? resolve()
    : reject()
);

// GetLast Tokens Transactions endpoint [HTTP POST]
const GetLastTnxTokens = (req, res) => {
  logger.api_requests(logit(req));      // log query data any way
  // set params from cfg constants
  let listId = cfg.list_type.token, // listOfTokens
    moduleId = cfg.modules.tnx,     // transactions
    options = check.build_options(req, listId, moduleId);
  logger.info(options);                 // log options to console
  GetTnx(options, res)
};

// GetLast ETH Transactions
const GetLastTnxEth = async (req, res) => {
  logger.api_requests(logit(req));      // log query data any way
  // set params from cfg constants
  let listId = cfg.list_type.eth,   // listOfETH
    moduleId = cfg.modules.tnx,     // transactions
    options = check.build_options(req, listId, moduleId);
  logger.info(options);                 // log options to console
  GetTnx(options, res)
};

// common tx details
const txDetails = async hash => {
  console.log(`${wid_ptrn}Get tx "0x${hash}" details`);
  try{
    let response = await tnx_model.txDetails(hash); // get tx details by hash
    return response.hasOwnProperty('empty')
      ? check.get_msg().not_found
      : response
  } catch (e) {
    return check.get_msg().not_found
  }
};

/* Get Transaction details endpoint
 * go reference:
 * TxDetails > api.GetTransaction(req.Hash){
 *   OK return {Rows: txInner, Head: txMain}
 *   ERROR return {Error: "Not found", Head: bson.M{}, Rows: []int{}}
 * }
 */
const GetTnxDetails = async (req, res) => {
  logger.api_requests(logit(req));      // log query data any way
  let hash = req.body.hash;
  let clear_hash = check.cut0xClean(hash);
  logger.info({ hash: hash, cleared_hash: clear_hash });
  ChekHash(clear_hash)
    .then(async () => res.json(await txDetails(clear_hash)))
    .catch(() => res.status(400).json(check.get_msg().bad_hash(hash)))
};

// count TNXS
const CountTnx = async (req, res) =>
  logger.api_requests(logit(req))                                         // log query any way
  && res.json(await dbquery.countTnx(Object.values(cfg.store.cols)));      // fwd data to model => count all

module.exports = {
  TnxDetails: GetTnxDetails,        // [HTTP REST] (API v.1) Get Transaction details endpoint
  countTnx: CountTnx,               // [HTTP REST] (API v.1) count TNXS
  getTnx: GetTnx,                   // [Socket.io] (API v.1) list
  getTxIo: txDetails                // [Socket.io] (API v.1) (Get Transaction detailsdirect access for socket IO
};
