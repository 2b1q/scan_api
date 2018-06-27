/*
* Block model.
* inherited from GO API:
    api.GetBlockTransactions(1000014, 2, 10, "txtype = 'tx'")
    api.GetBlock(1000014)
    api.GetBlock(10000)
    api.GetBlock(0)
*/
const MAX_SKIP  = require('../config/config').store.mongo.max_skip,
      cfg       = require('../config/config'),
      dbquery   = require('./db_query');

const GetblockTransactions = async (options = {}) => {
  // construct query options for block tnxs
  options = {
    max_skip: MAX_SKIP,
    selector: { block: options.entityId || 'block' }, // block tnx selector
    sort: { 'hash': 1 },
    ...options  // spread other options
  }
  return await dbquery.getDbTransactions(options)
}


module.exports = {
  blockTnxs: GetblockTransactions
}

/*
api.GetBlockTransactions(1000014, 2, 10, "txtype = 'tx'")
api.GetBlock(1000014)
api.GetBlock(10000)
api.GetBlock(0)
*/
