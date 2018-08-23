/*
 * Address model. v.1
 * inherited from GO API:
 *  api.GetAddrTransactions("2a65aca4d5fc5b5c859090a6c34d164135398226", 1, 10, "txtype = 'tx'")
 *  api.GetAddress("2a65aca4d5fc5b5c859090a6c34d164135398226")
 */
const cfg = require('../../config/config'),
    MAX_SKIP = cfg.store.mongo.max_skip,
    dbquery = require('./db_query'),
    ethproxy = require('../../node_interaction/eth-proxy-client');

/* eth get data timeouts. */
const wait = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

/* Get address details:
 *   GO api.GetAddress("2a65aca4d5fc5b5c859090a6c34d164135398226")
 */
const GetAddress = async (addr) => {
    let response = {};
    // construct query options for address details
    /** get address balance */
    let addr_balance = await ethproxy.getAddressBalance(addr).catch(() => null);
    let addrHeader_p = dbquery.findOne(cfg.store.cols.contract, { addr: addr });
    let mainTxCount_p = dbquery.countTnx(cfg.store.cols.eth, {
        $or: [{ addrto: addr }, { addrfrom: addr }],
    });
    let tokenList_p = addrTokenBalance({ addr: addr, skip: 0, size: 5 });

    return await Promise.all([addrHeader_p, mainTxCount_p, addr_balance, tokenList_p])
        .then(([addrHeader, { cnt }, eth_balance, tokenList]) => {
            // fix NaN if string is empty
            response.rows = [];
            response.head = {
                addr: addrHeader.addr || addr,
                maintxcount: cnt || 0,
                toptokenbalances: tokenList.tokens,
                totaltokens: tokenList.total,
                coin: 'ETH',
                data: null,
                decimals: 18,
                balance: eth_balance === null || eth_balance === undefined ? null : parseInt(eth_balance, 10).toString(16), // баланс ETH
                contract: 0, // dummy
                innertxcount: 0, // dummy
                tokentxcount: 0, // dummy
                totaltxcount: 0, // dummy
                maxtx: 0, // dummy
            };
            return response;
        })
        .catch((e) => e);
};

const GetAddrTokenBalance = async (options) => {
    let response = {};
    // construct query options for address details
    let tokenList_p = addrTokenBalance(options);

    return await Promise.all([tokenList_p])
        .then(([data]) => {
            response.rows = data.tokens;
            response.head = {
                entityId: options.addr,
                totalEntities: data.total,
                pageSize: options.size,
                skip: options.skip,
                infinityScroll: 1,
            };
            return response;
        })
        .catch((e) => e);
};

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
    let lastTokens = await dbquery.distinct(cfg.store.cols.token, last_tokens_selector, 'tokenaddr');

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
            tkn.balance = await ethproxy
                .tokenBalance({
                    walletAddr: addr,
                    tokenAddr: tkn.addr,
                })
                .catch(() => null);
            tkn.balance = tkn.balance === null || tkn.balance === undefined ? null : parseInt(tkn.balance, 10).toString(16);
        }
        partToken.push(tkn);
    }

    console.log(`totalTokens = ${totalTokens}`);
    console.log(`partToken.length = ${partToken.length}`);
    return { tokens: partToken, total: totalTokens };
};

/*
 * Get address tnx:
 *  GO api.GetAddrTransactions("2a65aca4d5fc5b5c859090a6c34d164135398226", 1, 10, "txtype = 'tx'")
 */
const GetAddrTransactions = async (options) => {
    let { addr, collection } = options;
    // addr tnx selector
    let selector = {
        $or: [{ addrto: addr }, { addrfrom: addr }],
    };
    // count tnx by query selector
    let { cnt } = await dbquery.countTnx(collection, selector);
    if (cnt === 0) return { rows: [] }; // stop flow
    //if( cnt > MAX_SKIP ) cnt = MAX_SKIP;
    // construct query options for addr tnxs
    options = {
        max_skip: MAX_SKIP,
        selector: selector,
        sort: { block: -1 },
        ...options, // spread other options
    };
    return await dbquery.getDbTransactions(options);
};

module.exports = {
    getAddr: GetAddress,
    addrTnxs: GetAddrTransactions,
    addrTokenBalance: GetAddrTokenBalance,
};
