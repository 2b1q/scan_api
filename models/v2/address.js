/*
 * Address model v.2
 */
const cfg = require('../../config/config'),
    MAX_SKIP = cfg.store.mongo.max_skip,
    dbquery = require('./db_query'),
    eth_func = require('../../ether/functions'),
    eth_col = cfg.store.cols.eth,
    token_col = cfg.store.cols.token,
    erc_20_col = cfg.store.cols.erc20_cache,
    addr_header_col = 'address_header',
    TOKEN_LIST_SIZE = 55; // TODO move to config

/* eth get data timeouts. */
const wait = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

// Get address details API v.2:
const GetAddressDetails = async (addr) => {
    let response = {}; // response object
    // get DB collections
    const eth_db_col = await dbquery.getcol(eth_col);
    const token_db_col = await dbquery.getcol(token_col);
    const erc20_db_col = await dbquery.getcol(erc_20_col);
    /** count from aggregation addr_header_db_col */
    const addrAggr = await dbquery.findOne(addr_header_col, { addr: addr });
    /** ETH Transaction details **/
    let main_tx_selector = { $or: [{ addrto: addr }, { addrfrom: addr }] };
    let inner_tx_selector = { $or: [{ addrto: addr }, { addrfrom: addr }], isinner: 1 };
    // ETH count
    let mainTxCount_p = eth_db_col.count(main_tx_selector); // кол-во основных транзакций эфира
    let innerTxCount_p = eth_db_col.count(inner_tx_selector); // кол-во внутренних транзакций эфира
    let addr_balance_p = eth_func.providerEthProxy('getbalance', { addr: addr }); // ETH balance
    /** Token Transaction details **/
    let erc20_selector = { addr: addr };
    // Token count
    let tokenTxCount_p = token_db_col.count(main_tx_selector); // кол-во всех транзакций по токенам
    let token_erc20_p = erc20_db_col.count(erc20_selector); // кол-во токенов которые были или есть у данного адреса
    // WA addrAggr.maintx || mainTxCount_p
    return await Promise.all([
        addrAggr.maintx || mainTxCount_p,
        addrAggr.innertx || innerTxCount_p,
        addr_balance_p,
        addrAggr.tokentx || tokenTxCount_p,
        token_erc20_p,
    ])
        .then(([main_cnt, inner_cnt, eth_balance = 0, token_tx_cnt, erc_20_cnt]) => {
            response.head = {
                addr: addr, // адрес после "нормализации" (без 0х, малый регистр)
                mainTxCount: main_cnt, // кол-во основных транзакций эфира
                innerTxCount: inner_cnt, // кол-во внутренних транзакций эфира
                tokenTxCount: token_tx_cnt, // кол-во всех транзакций по токенам
                totalTokens: erc_20_cnt, // кол-во токенов которые были или есть у данного адреса
                balance: parseInt(eth_balance, 10).toString(16), // баланс ETH
                decimals: 18, // знаков после "."
            };
            return response;
        })
        .catch((e) => e); // catch and return throwed exception OR Promise.reject()
};

/** Get Token balance API v.2 */
const GetAddrTokenBalance = async (options) => {
    console.log(options);
    let { addr, offset, size } = options;

    let lastCachedBlock = 0;
    let allTokensMap = new Map();

    const tokenCacheCol = await dbquery.find(erc_20_col, { addr: addr, lastblock: { $gt: 0 } });
    const ctl = await dbquery.find(erc_20_col, { addr: addr, lastblock: 0 });

    const cachedTokenBlocks = async () => {
        for (let i = 0; i < 5; i++) {
            if (tokenCacheCol.rows === 0) await wait(50);
            else {
                tokenCacheCol.forEach((c_block) => {
                    console.log(`c_block.lastblock = ${c_block.lastblock}`);
                    if (c_block.lastblock > lastCachedBlock) lastCachedBlock = c_block.lastblock;
                    return 0;
                });
                break;
            }
        }
        return 0; // done
    };

    await cachedTokenBlocks();

    if (Array.isArray(ctl)) {
        ctl.forEach((tkn) => {
            allTokensMap.set(tkn.tokenaddr, {
                addr: tkn.tokenaddr,
                name: tkn.tokenname,
                smbl: tkn.tokensmbl,
                dcm: tkn.tokendcm,
                type: 20,
                balance: tkn.value,
                icon: '/api/token/icon/' + tkn.tokenaddr,
                dynamic: 0,
            });
        });
    }

    let last_tokens_selector = {
        $or: [{ addrto: addr }, { addrfrom: addr }],
        block: { $gt: lastCachedBlock },
        tokentype: 20,
    };
    let lastTokens = await dbquery.distinct(token_col, last_tokens_selector, 'tokenaddr');

    let lastTokensPromiseList = [];
    lastTokens.forEach((t) => lastTokensPromiseList.push(dbquery.findOne(cfg.store.cols.token_head, { addr: t })));

    // await parallel ETH token balance requests
    await Promise.all(lastTokensPromiseList)
        .then((tokens) => {
            tokens.forEach((token) => {
                token.balance = '*';
                token.icon = '/api/token/icon/' + token.addr;
                token.dynamic = 0;
                allTokensMap.set(token.addr, token);
            });
        })
        .catch((e) => logger.error(e));

    let allTokens = Array.from(allTokensMap);
    allTokens.sort(function(a, b) {
        if (a[1].name > b[1].name) return 1;
        else return -1;
    });

    let totalTokens = allTokens.length;
    let fromI = offset;
    let toI = offset + size;
    if (fromI < 0) fromI = 0;
    if (fromI > totalTokens) fromI = totalTokens;
    if (toI < 0) toI = 0;
    if (toI > totalTokens) toI = totalTokens;
    if (fromI > toI) toI = fromI;

    let partToken = [];
    for (let i = fromI; i < toI; i += 1) {
        let tkn = allTokens[i][1];
        if (tkn.balance === '*') {
            tkn.balance = await eth_func.providerEthProxy('tokenbalance', {
                walletAddr: addr,
                tokenAddr: tkn.addr,
            });
            tkn.balance = parseInt(tkn.balance, 10).toString(16);
        }
        partToken.push(tkn);
    }

    console.log({
        totalTokens: totalTokens,
        ['partToken.length']: partToken.length,
    });

    return {
        head: {
            totalEntities: totalTokens,
            addr: addr,
            offset: offset,
            size: size,
            infinityScroll: 1,
        },
        rows: partToken,
    };
};

//  Get address tnx API v.2:
const GetAddrTransactions = async (options) => {
    options.selector = { $or: [{ addrto: options.addr }, { addrfrom: options.addr }] };
    options.sort = { block: -1 };
    console.log(options);
    let { addr, collection, size, offset, selector, sort } = options;
    const db_col = await dbquery.getcol(collection);
    let count = await db_col.count(selector);
    if (count === 0) return 0;
    if (count > MAX_SKIP) count = MAX_SKIP;
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

    return new Promise((resolve) =>
        db_col
            .find(selector, { fields }, { allowDiskUse: true }) // allowDiskUse lets the server know if it can use disk to store temporary results for the aggregation (requires mongodb 2.6 >)
            .sort(sort)
            .skip(offset)
            .limit(size)
            .toArray((err, docs) => {
                if (err) resolve(false); // stop flow and return false without exeption
                resolve({
                    head: {
                        addr: addr,
                        totalEntities: count,
                        size: size,
                        offset: offset,
                    },
                    rows: docs,
                });
            })
    );
};

module.exports = {
    details: GetAddressDetails,
    transactions: GetAddrTransactions,
    tokenBalance: GetAddrTokenBalance,
};
