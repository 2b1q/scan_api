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
 * Get block details:
 *  GO api.GetBlock(1000014)
 */
const GetBlockDetails = async block => {
  // construct query options for block details
  let options = {
    block: block,
    block_col: cfg.store.cols.block,                // get block collection name
    ether_col: cfg.store.cols.eth,                  // get ether collection name
    block_selector: { 'block': block },             // block selector
    tnx_selector: { 'block': block, 'isinner': 0 }  // tnx selector
  };
  console.log(options);
  let { block_col, ether_col, block_selector, tnx_selector } = options;
  // assign new Object 'inner_selector' from 'tnx_selector' and change 'isinner' property
  let inner_selector = Object.assign({}, tnx_selector, { isinner: 1 }); // fix bug with one object reference modification
  let blockHeader_p = dbquery.findOne(block_col, block_selector);
  let mainTxCount_p = dbquery.colCount(ether_col, tnx_selector);
  let innerTxCount_p = dbquery.colCount(ether_col, inner_selector);


  return await dbquery.blockDetails(options) // TODO move behavior (GetBlock) from dbquery
  Promise.all([blockHeader_p, mainTxCount_p, innerTxCount_p])
    .then(([block, main, inner] = data) => {
      if(block.block)
        return ({
          head: {
            ...block,
            maintxcount: main.cnt,
            innertxcount: inner.cnt
          }
        });
      else return { error: 404, msg: "Not found" };
    })
    .catch(e => e)
};


module.exports = {
  transactions: GetBlockTransactions,  // Get block tnx (GO api.GetBlockTransactions(1000014, 2, 10, "txtype = 'tx'"))
  details: GetBlockDetails               // get block details
};
