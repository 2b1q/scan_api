/*
 * Block model. API v.2
 */
const
  cfg = require('../../config/config'),
  MAX_SKIP = cfg.store.mongo.max_skip,
  dbquery = require('./db_query');

/*
 * Get block tnx:
 *  GO api.GetBlockTransactions(1000014, 2, 10, "txtype = 'tx'")
 */
const GetBlockTransactions = async (options = {}) => {
  // construct query options for block tnxs
  options = {
    max_skip: MAX_SKIP,
    selector: { block: options.entityId || 'block' }, // block tnx selector
    sort: { 'hash': 1 },
    ...options  // spread other options
  };
  return await dbquery.getDbTransactions(options) // TODO move behavior (getDbTransactions) from dbquery
};

/*
 Get block details model API v2
 use this API do get data with socket.io and http.
 Input data:
 > validated block
 Query options constructing here
 clear model:
 > dbquery module using only for mongo queries
 > response payload constructing here
 */
const GetBlockDetails = async block => {
  // construct query options for block details
  let options = {
    block: block,
    block_col: cfg.store.cols.block,                  // get block collection name
    ether_col: cfg.store.cols.eth,                    // get ether collection name
    token_col: cfg.store.cols.token,                  // get token collection name
    block_selector: { 'block': block },               // block selector
    tnx_selector: { 'block': block, 'isinner': 0 },   // tnx selector
    token_selector: { 'block': block }               // token tnx selector
  };
  console.log(options);
  let { block_col, ether_col, block_selector, tnx_selector, token_col, token_selector } = options;
  // assign new Object 'inner_selector' from 'tnx_selector' and change 'isinner' property
  let inner_selector = Object.assign({}, tnx_selector, { isinner: 1 }); // fix bug with one object reference modification
  let blockHeader_p = dbquery.findOne(block_col, block_selector);
  let mainTxCount_p = dbquery.colCount(ether_col, tnx_selector);
  let innerTxCount_p = dbquery.colCount(ether_col, inner_selector);
  let tokenTxCount_p = dbquery.colCount(token_col, token_selector);
  // return cleared response payload data
  return await
    Promise.all([blockHeader_p, mainTxCount_p, innerTxCount_p, tokenTxCount_p])
      .then(([block, main, inner, tokens] = data) => {
        if(block.block)
          return ({
            head: {
              hash: block.hash,         // хэш блока
              block: block.block,       // номер блока
              mainTxCount: main.cnt,    // кол-во основных транзакций эфира
              innerTxCount: inner.cnt,  // кол-во внутренних транзакций эфира
              tokenTxCount: tokens.cnt, // кол-во всех транзакций по токенам
              gasLimit: block.gaslimit, // лимит газа
              gasUsed: block.gasused,   // использовано газа
              isoTime: block.isotime    // время появления блока
            }
          });
        // if we haven`t block property -> it`s 404 error
        else return { error: 404, msg: "Not found" };
      })
      // exception handler
      .catch(e => e)
};


module.exports = {
  transactions: GetBlockTransactions,  // Get block tnx (GO api.GetBlockTransactions(1000014, 2, 10, "txtype = 'tx'"))
  details: GetBlockDetails               // get block details
};
