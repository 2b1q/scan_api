/*
 * Transaction model v.1
 * inherited from GO API:
 *  api.GetLastTransactions(2, 10, "tx")
 *  api.GetTransaction("e25db473556c7ecda92ebf7226ff022ef2f49fb11f03404d04987f69894f4548")
 */
const MAX_SKIP = require('../../config/config').store.mongo.max_skip,
    cfg = require('../../config/config'),
    dbquery = require('./db_query');

/* get last tnxs
 * Go e.g. api.GetLastTransactions(2, 10, "tx")
 */
const GetLastTransactions = async (options = {}) => {
    // construct query options for last tnxs
    options = {
        max_skip: MAX_SKIP,
        selector: {}, // last tnx selector
        sort: { block: -1 },
        ...options, // spread other options
    };
    return await dbquery.getDbTransactions(options);
};

/* Get tnx details by tx hash
 * go e.g. api.GetTransaction("e25db473556c7ecda92ebf7226ff022ef2f49fb11f03404d04987f69894f4548")
 */
const TxDetails = async (hash) => await dbquery.TxDetails(hash, { hash: hash });

module.exports = {
    getLastTnxs: GetLastTransactions, // from api.GetLastTransactions
    txDetails: TxDetails, // from TxDetails > api.GetTransaction(req.Hash)
};
