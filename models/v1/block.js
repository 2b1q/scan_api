/*
 * Block model. API v.1
 */
const cfg = require('../../config/config'),
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
        sort: { hash: 1 },
        ...options, // spread other options
    };
    return await dbquery.getDbTransactions(options);
};

/*
 * Get block details:
 *  GO api.GetBlock(1000014) 
 */
const GetBlock = async (block) => {
    // construct query options for block details
    let options = {
        block: block,
        block_col: cfg.store.cols.block, // get block collection name
        ether_col: cfg.store.cols.eth, // get ether collection name
        token_col: cfg.store.cols.token, // get token collection name
        block_selector: { block: block }, // block selector
        tnx_selector: { block: block, isinner: 0 }, // tnx selector
        token_selector: { block: block }, // token tnx selector
    };
    return await dbquery.getBlock(options);
};

module.exports = {
    blockTnxs: GetBlockTransactions, // Get block tnx (GO api.GetBlockTransactions(1000014, 2, 10, "txtype = 'tx'"))
    getBlock: GetBlock, // get block details
};
