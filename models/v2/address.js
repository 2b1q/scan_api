/*
 * Address model v.2
 */
const cfg = require('../../config/config'),
    c = cfg.color,
    MAX_SKIP = cfg.store.mongo.max_skip,
    dbquery = require('./db_query'),
    eth_col = cfg.store.cols.eth,
    token_col = cfg.store.cols.token,
    erc_20_col = cfg.store.cols.erc20_cache,
    addr_header_col = 'address_header',
    address_eth_txn_col = 'address_eth_txn',
    address_token_txn_col = 'address_token_txn',
    ethproxy = require('../../node_interaction/eth-proxy-client'),
    TOKEN_LIST_SIZE = 55, // TODO move to config
    ETHDCM = cfg.constants.ethdcm,
    TOKENDCM = cfg.constants.tokendcm,
    FEEDCM = cfg.constants.feedcm;

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
    /** get address balance */
    let addr_balance = await ethproxy.getAddressBalance(addr).catch(() => null);

    /** Token Transaction details **/
    let erc20_selector = { addr: addr };
    // Token count
    let tokenTxCount_p = token_db_col.count(main_tx_selector); // кол-во всех транзакций по токенам
    let token_erc20_p = erc20_db_col.count(erc20_selector); // кол-во токенов которые были или есть у данного адреса
    // WA addrAggr.maintx || mainTxCount_p
    return await Promise.all([
        addrAggr.maintx || mainTxCount_p, // if addrAggr.maintx is undefined => use mainTxCount_p promise
        addrAggr.innertx || innerTxCount_p,
        addr_balance,
        addrAggr.tokentx || tokenTxCount_p,
        token_erc20_p,
    ])
        .then(([main_cnt, inner_cnt, eth_balance, token_tx_cnt, erc_20_cnt]) => {
            response.head = {
                addr: addr, // адрес после "нормализации" (без 0х, малый регистр)
                mainTxCount: main_cnt, // кол-во основных транзакций эфира
                innerTxCount: inner_cnt, // кол-во внутренних транзакций эфира
                tokenTxCount: token_tx_cnt, // кол-во всех транзакций по токенам
                totalTokens: erc_20_cnt, // кол-во токенов которые были или есть у данного адреса
                balance: { val: eth_balance === null || eth_balance === undefined ? null : eth_balance, dcm: ETHDCM },
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
            tkn.balance = await ethproxy.tokenBalance([addr, tkn.addr]).catch(() => null);
            tkn.balance = tkn.balance === null || tkn.balance === undefined ? null : tkn.balance;
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

// < 10k tx getter
const slowTxGetter = (db_col, selector, fields, sort, offset, size, count, addr) =>
    new Promise((resolve) =>
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

/** get address Token tx list*/
const getTokenTx = async (addr, size, offset, selector, sort, count) => {
    const fields = {
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
    if (count === 0) return 0;
    if (count > MAX_SKIP) count = MAX_SKIP;
    if (count < 10000) {
        // slow query
        const token_col = await dbquery.getcol('token_txn');
        return await slowTxGetter(token_col, selector, fields, sort, offset, size, count, addr);
    } else {
        const cache_size = await dbquery.getcol(address_token_txn_col).then((db) => db.count({ addr: addr }));
        console.log(`${c.yellow}Token cache_size for addr ${c.magenta}${addr}${c.yellow} is: ${c.red}${cache_size}${c.white}`);
        // deep search
        if (offset + size > cache_size) {
            console.log(`${c.red}offset + size > cache_size. Deep Search. Use old search method${c.white}`);
            const token_col = await dbquery.getcol('token_txn');
            return await slowTxGetter(token_col, selector, fields, sort, offset, size, count, addr);
        } else {
            console.log(`${c.red}using tokenBooster${c.white}`);
            return await tokenBooster(addr, offset, size, fields, count, sort);
        }
    }
};

/** get address ETH tx list*/
const getEthTx = async (addr, size, offset, selector, sort, count) => {
    // set MongoDB fields
    const fields = {
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
    };
    if (count === 0) return 0;
    if (count > MAX_SKIP) count = MAX_SKIP;
    if (count < 10000) {
        // slow query
        const eth_col = await dbquery.getcol('ether_txn');
        return await slowTxGetter(eth_col, selector, fields, sort, offset, size, count, addr);
    } else {
        const cache_size = await dbquery.getcol(address_eth_txn_col).then((db) => db.count({ addr: addr }));
        console.log(`${c.yellow}ETH cache_size for addr ${c.magenta}${addr}${c.yellow} is: ${c.red}${cache_size}${c.white}`);
        // deep search
        if (offset + size > cache_size) {
            console.log(`${c.red}offset + size > cache_size. Deep Search. Use old search method${c.white}`);
            const eth_col = await dbquery.getcol('ether_txn');
            return await slowTxGetter(eth_col, selector, fields, sort, offset, size, count, addr);
        } else {
            console.log(`${c.red}using ethBooster${c.white}`);
            return await ethBooster(addr, offset, size, fields, count, sort);
        }
    }
};

/** address_token_txn booster
 * heavy address booster if Token txs count > 10k*/
const tokenBooster = async (addr, offset, size, fields, count, sort) =>
    new Promise((resolve) =>
        dbquery.getcol(address_token_txn_col).then((db_col) =>
            db_col
                .find({ addr: addr }, { fields })
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
        )
    );

/** address_eth_txn booster
 * heavy address booster if ETH txs count > 10k*/
const ethBooster = (addr, offset, size, fields, count, sort) =>
    new Promise((resolve) =>
        dbquery.getcol(address_eth_txn_col).then((db_col) =>
            db_col
                .find({ addr: addr }, { fields })
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
        )
    );

/**  Get address tnx API v.2:*/
const GetAddrTransactions = async (options) => {
    options.selector = { $or: [{ addrto: options.addr }, { addrfrom: options.addr }] };
    options.sort = { block: -1 };
    let { addr, collection, size, offset, selector, sort } = options;
    // lookup tx counters in 'address_header' collection
    const addrAggr = await dbquery.findOne(addr_header_col, { addr: addr });
    const totalEthTxCnt = addrAggr.maintx + addrAggr.innertx;
    const totalTokenTxCnt = addrAggr.tokentx;
    return collection === 'ether_txn'
        ? await getEthTx(addr, size, offset, selector, sort, totalEthTxCnt)
        : await getTokenTx(addr, size, offset, selector, sort, totalTokenTxCnt);
};

module.exports = {
    details: GetAddressDetails,
    transactions: GetAddrTransactions,
    tokenBalance: GetAddrTokenBalance,
};
