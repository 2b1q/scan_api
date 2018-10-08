/*
 * Block model. API v.2
 */
const cfg = require('../../config/config'),
    MAX_SKIP = cfg.store.mongo.max_skip,
    dbquery = require('./db_query');

/*
 Get block ETH and token tnx model API v.2
 */
const GetBlockTransactions = async (options) => {
    // construct query options for block ETH and token tnxs
    options = {
        selector: { block: options.block }, // block tnx selector
        sort: { hash: 1 },
        ...options, // spread other options
    };
    let { selector, collection, sort, offset, size, block } = options;
    // MongoDB data optimization => use only necessary fields/columns
    let fields =
        collection === 'ether_txn'
            ? {
                  hash: 1,
                  block: 1,
                  addrfrom: 1,
                  addrto: 1,
                  isotime: 1,
                  type: 1,
                  status: 1,
                  error: 1,
                  iscontract: 1,
                  isinner: 1,
                  value: 1,
                  txfee: 1,
                  gasused: 1,
                  gascost: 1,
                  tokendcm: 1,
              }
            : {
                  hash: 1,
                  block: 1,
                  addrfrom: 1,
                  addrto: 1,
                  isotime: 1,
                  type: 1,
                  status: 1,
                  error: 1,
                  iscontract: 1,
                  isinner: 1,
                  value: 1,
                  txfee: 1,
                  gasused: 1,
                  gascost: 1,
                  tokenaddr: 1,
                  tokenname: 1,
                  tokensmbl: 1,
                  tokendcm: 1,
                  tokentype: 1,
              };
    console.log(options);
    const db_col = await dbquery.getcol(collection);
    let count = await db_col.count(selector);
    if (count === 0) return 0;
    if (count > MAX_SKIP) count = MAX_SKIP;
    return new Promise((resolve) =>
        db_col
            .find(selector, { fields }, { allowDiskUse: true }) // allowDiskUse lets the server know if it can use disk to store temporary results for the aggregation (requires mongodb 2.6 >)
            .sort(sort)
            .skip(offset)
            .limit(size)
            .toArray((err, docs) => {
                if (err) return resolve(false); // stop flow and return false without exeption
                resolve({
                    head: {
                        totalEntities: count,
                        offset: offset,
                        size: size,
                        blockNumber: block,
                    },
                    rows: docs,
                });
            })
    );
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
const GetBlockDetails = async (block) => {
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
    console.log(options);
    let { block_col, ether_col, block_selector, tnx_selector, token_col, token_selector } = options;
    // assign new Object 'inner_selector' from 'tnx_selector' and change 'isinner' property
    let inner_selector = Object.assign({}, tnx_selector, { isinner: 1 }); // fix bug with one object reference modification
    let blockHeader_p = dbquery.findOne(block_col, block_selector);
    let mainTxCount_p = dbquery.colCount(ether_col, tnx_selector);
    let innerTxCount_p = dbquery.colCount(ether_col, inner_selector);
    let tokenTxCount_p = dbquery.colCount(token_col, token_selector);
    // return cleared response payload data
    return await Promise.all([blockHeader_p, mainTxCount_p, innerTxCount_p, tokenTxCount_p])
        .then(([block, main, inner, tokens] = data) => {
            if (block.block)
                return {
                    head: {
                        hash: block.hash, // хэш блока
                        block: block.block, // номер блока
                        mainTxCount: main.cnt, // кол-во основных транзакций эфира
                        innerTxCount: inner.cnt, // кол-во внутренних транзакций эфира
                        tokenTxCount: tokens.cnt, // кол-во всех транзакций по токенам
                        gasLimit: block.gaslimit, // лимит газа
                        gasUsed: block.gasused, // использовано газа
                        time: block.isotime, // время появления блока
                    },
                };
            else return { error: 'not found' };
        })
        // exception handler
        .catch((e) => e);
};

module.exports = {
    transactions: GetBlockTransactions, // get block ETH and Token tnx API v.2
    details: GetBlockDetails, // get block details API v.2
};
