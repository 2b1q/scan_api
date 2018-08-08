/*
 * Transaction model v.2
 */
const cfg = require('../../config/config'),
    MAX_SKIP = cfg.store.mongo.max_skip,
    dbquery = require('./db_query');

/*/!* get last tnxs
 * Go e.g. api.GetLastTransactions(2, 10, "tx")
 *!/
const GetLastTransactions = async (options = {}) => {
    // construct query options for last tnxs
    options = {
        max_skip: MAX_SKIP,
        selector: {}, // last tnx selector
        sort: { block: -1 },
        ...options, // spread other options
    };
    return await dbquery.getDbTransactions(options);
};*/

/** Get transaction details*/
// const GetTxDetails = async (hash) => await dbquery.TxDetails(hash, { hash: hash });
const GetTxDetails = async (hash) => hash; // dummy

module.exports = {
    // lastTransactions: GetLastTransactions, // from api.GetLastTransactions
    details: GetTxDetails, // API v.2 Get TxDetails
};
