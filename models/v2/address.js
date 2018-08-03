/*
 * Address model v.2
 */
const cfg = require('../../config/config'),
    MAX_SKIP = cfg.store.mongo.max_skip,
    dbquery = require('./db_query'),
    eth_func = require('../../ether/functions'),
    TOKEN_LIST_SIZE = 55; // TODO move to config

/* eth get data timeouts. */
const wait = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

// Get address details:
const GetAddressDetails = async (addr) => {
    let response = {};
    // construct query options for address details
    let main_tx_selector = { $or: [{ addrto: addr }, { addrfrom: addr }] };
    let inner_tx_selector = { $or: [{ addrto: addr }, { addrfrom: addr }], isinner: 1 };
    // let token_list_selector = { addr: addr, skip: 0, size: TOKEN_LIST_SIZE }
    let token_list_selector = { addr: addr, skip: 0 };
    // get DB collections
    const eth_col = cfg.store.cols.eth,
        token_col = cfg.store.cols.token;
    const eth_db_col = await dbquery.getcol(eth_col);
    const token_db_col = await dbquery.getcol(token_col);
    // eth count
    let mainTxCount_p = eth_db_col.count(main_tx_selector);
    let innerTxCount_p = eth_db_col.count(inner_tx_selector);
    // ETH balance
    let addr_balance_p = eth_func.providerEthProxy('getbalance', { addr: addr });
    // token count
    let tokenTxCount_p = token_db_col.count(main_tx_selector);
    let tokenList_p = addrTokenBalance(token_list_selector);
    // let addrHeader_p = dbquery.findOne(cfg.store.cols.contract, { 'addr': addr });

    return await Promise.all([
        mainTxCount_p,
        innerTxCount_p,
        addr_balance_p,
        tokenTxCount_p,
        tokenList_p,
    ])
        .then(([main_cnt, inner_cnt, eth_balance = 0, token_tx_cnt, total_t]) => {
            // fix NaN if string is empty
            response.rows = [];
            response.head = {
                addr: addr, // адрес после "нормализации" (без 0х, малый регистр)
                mainTxCount: main_cnt, // кол-во основных транзакций эфира
                innerTxCount: inner_cnt, // кол-во внутренних транзакций эфира
                tokenTxCount: token_tx_cnt, // кол-во всех транзакций по токенам
                totalTokens: total_t.total, // кол-во токенов которые были или есть у данного адреса
                balance: parseInt(eth_balance, 10).toString(16), // баланс ETH
                decimals: 18, // знаков после "."
            };
            return response;
        })
        .catch((e) => e);
};

// const GetAddrTokenBalance = async options => {
//   let response = {};
//   // construct query options for address details
//   let tokenList_p = addrTokenBalance(options);
//
//   return await Promise.all([tokenList_p]).then(([data]) => {
//     response.rows = data.tokens;
//     response.head = {
//       entityId: options.addr,
//       totalEntities: data.total,
//       pageSize: options.size,
//       skip: options.skip,
//       infinityScroll: 1,
//     };
//     return response
//   }).catch(e => e)
// };

const addrTokenBalance = async (options) => {
    let { addr, skip, size } = options;

    let lastCachedBlock = 0;
    let cache_selector = { addr: addr, lastblock: { $gt: 0 } };
    let allTokensMap = new Map();

    console.log(`addr = ${addr}`);
    console.log(`skip = ${skip}`);
    console.log(`size = ${size}`);

    let cachedTokenBlocks = async () => {
        for (let i = 0; i < 5; i++) {
            let tokenCacheCol_p = await dbquery.find(cfg.store.cols.erc20_cache, cache_selector);
            if (tokenCacheCol_p.rows === 0) await wait(50);
            else {
                tokenCacheCol_p.forEach((c_block) => {
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

    let ctl_p = await dbquery.find(cfg.store.cols.erc20_cache, { addr: addr, lastblock: 0 });
    if (Array.isArray(ctl_p)) {
        ctl_p.forEach((tkn) => {
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
    let lastTokens = await dbquery.distinct(
        cfg.store.cols.token,
        last_tokens_selector,
        'tokenaddr'
    );

    let lastTokensPromiseList = [];
    lastTokens.forEach((t) => {
        lastTokensPromiseList.push(dbquery.findOne(cfg.store.cols.token_head, { addr: t }));
    });

    await Promise.all(lastTokensPromiseList).then((lastTokensPromiseList) => {
        lastTokensPromiseList.forEach((tkn) => {
            if (tkn) {
                tkn.balance = '*';
                tkn.icon = '/api/token/icon/' + tkn.addr;
                tkn.dynamic = 0;
                allTokensMap.set(tkn.addr, tkn);
            }
        });
    });

    let allTokens = Array.from(allTokensMap);
    allTokens.sort(function(a, b) {
        if (a[1].name > b[1].name) return 1;
        else return -1;
    });

    let totalTokens = allTokens.length;
    let fromI = skip;
    let toI = skip + size;
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

    console.log(`totalTokens = ${totalTokens}`);
    console.log(`partToken.length = ${partToken.length}`);
    return { tokens: partToken, total: totalTokens };
};
//
// /*
//  * Get address tnx:
//  *  GO api.GetAddrTransactions("2a65aca4d5fc5b5c859090a6c34d164135398226", 1, 10, "txtype = 'tx'")
//  */
// const GetAddrTransactions = async options => {
//   let { addr, collection } = options;
//   // addr tnx selector
//   let selector = {
//     $or: [{ 'addrto': addr },
//       { 'addrfrom': addr }]
//   };
//   // count tnx by query selector
//   let { cnt } = await dbquery.colCount(collection, selector);
//   if(cnt === 0) return { rows: [] }; // stop flow
//   //if( cnt > MAX_SKIP ) cnt = MAX_SKIP;
//   // construct query options for addr tnxs
//   options = {
//     max_skip: MAX_SKIP,
//     selector: selector,
//     sort: { 'block': -1 },
//     ...options  // spread other options
//   };
//   return await dbquery.getDbTransactions(options)
// };

module.exports = {
    details: GetAddressDetails,
    // transactions: GetAddrTransactions,
    // tokenBalance: GetAddrTokenBalance
};
