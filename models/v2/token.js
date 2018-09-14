const cluster = require('cluster'),
    cfg = require('../../config/config'),
    moment = require('moment'),
    ethproxy = require('../../node_interaction/eth-proxy-client'),
    db = require('../../libs/db'),
    check = require('../../utils/checker').cheker(),
    token_head = cfg.store.cols.token_head,
    erc20cache = cfg.store.cols.erc20_cache,
    token_col = cfg.store.cols.token,
    day_market_stat_col = 'erc20_day_market_stats',
    hour_market_stat_col = 'erc20_hour_market_stats',
    c = cfg.color;

/** worker id pattern */
const wid_ptrn = (msg) =>
    `${c.green}worker[${cluster.worker.id}]${c.red}[API v.2]${c.cyan}[token module]${c.red} > ${c.green}[${msg}] ${c.white}`;

/** findQuery*/
const findOne = (collection, query, fields) =>
    new Promise(
        (resolve, reject) =>
            db
                .get()
                .then((db_instance) => {
                    if (!db_instance) resolve();
                    db_instance
                        .collection(collection)
                        .findOne(query, { fields })
                        .then((doc) => resolve(doc))
                        .catch((e) => {
                            console.error(e);
                            reject();
                        });
                })
                .catch((e) => reject(e)) // handle error if no DB instance
    );

/** findQuery polymorphic */
const find = (collection, query, skip, limit, sort) =>
    new Promise(
        (resolve, reject) =>
            db
                .get()
                .then((db_instance) => {
                    if (!db_instance) resolve();
                    (sort &&
                        db_instance
                            .collection(collection)
                            .find(query)
                            .sort(sort)
                            .skip(skip)
                            .limit(limit)
                            .toArray((err, txs) => {
                                if (err) reject(err); // handle error on query crash
                                resolve(txs);
                            })) ||
                        db_instance
                            .collection(collection)
                            .find(query)
                            .skip(skip)
                            .limit(limit)
                            .toArray((err, txs) => {
                                if (err) reject(err); // handle error on query crash
                                resolve(txs);
                            });
                })
                .catch((e) => reject(e)) // handle error if no DB instance
    );

/** counter */
const count = (collection, query) =>
    new Promise(
        (resolve, reject) =>
            db
                .get()
                .then((db_instance) => {
                    if (!db_instance) resolve();
                    db_instance
                        .collection(collection)
                        .count(query)
                        .then((cnt) => resolve(cnt))
                        .catch((e) => reject(e)); // handle error on query crash
                })
                .catch((e) => reject(e)) // handle error if no DB instance
    );

/** ERC20 Token details */
exports.erc20info = (addr) =>
    new Promise((resolve) => {
        console.log(`${wid_ptrn('erc20info')}`);
        /** register Promises */
        const totalHoldersP = count(erc20cache, { tokenaddr: addr });
        const tokenInfoP = findOne(token_head, { addr: addr, type: 20 }, { addr: 1, name: 1, smbl: 1, dcm: 1, _id: 0 });
        const tokenMarketP = findOne(
            day_market_stat_col,
            { addr: addr },
            {
                percent_change: 1,
                price: 1,
                maxprice: 1,
                datetime: 1,
                _id: 0,
                volume: 1,
                minprice: 1,
                capacity: 1,
                circulation: 1,
                dcm: 1,
            }
        );
        /** resolve in parallel */
        Promise.all([totalHoldersP, tokenInfoP, tokenMarketP])
            .then(
                ([thp, tokenHeader, market]) =>
                    (thp &&
                        resolve({
                            head: {
                                ...tokenHeader,
                                totalSupply: 0,
                                totalHolders: thp,
                                overview: '',
                                percentChange: market.percent_change,
                                price: market.price,
                                maxPrice: market.maxprice,
                                minPrice: market.minprice,
                                capacity: market.capacity,
                                volume: market.volume,
                                circulation: { val: market.circulation, dcm: market.dcm },
                            },
                        })) ||
                    resolve(check.get_msg()['404'])
            )
            .catch((e) => console.error(e) && resolve({ head: {} }));
    });

/** ERC20 token transactions */
exports.erc20txlist = ({ size, offset, addr }) =>
    new Promise((resolve) => {
        console.log(`${wid_ptrn('erc20txlist')}`);
        let query = { tokenaddr: addr };
        /** register Promises */
        const totalEntitiesP = count(token_col, query);
        const txsP = find(token_col, query, offset, size);
        /** resolve in parallel */
        Promise.all([totalEntitiesP, txsP])
            .then(
                ([totalEntities, txs]) =>
                    (totalEntities &&
                        resolve({
                            head: { totalEntities: totalEntities, offset: offset, size: size, addr: addr, updateTime: moment() },
                            rows: txs.map((tx) =>
                                Object({
                                    id: tx._id,
                                    hash: tx.hash,
                                    block: tx.block,
                                    addrFrom: tx.addrfrom,
                                    addrTo: tx.addrto,
                                    time: tx.isotime,
                                    status: tx.status,
                                    error: tx.error,
                                    isContract: tx.iscontract,
                                    isInner: tx.isinner,
                                    value: { val: tx.value, dcm: tx.tokendcm },
                                    tokenAddr: tx.tokenaddr,
                                    tokenName: tx.tokenname,
                                    tokenSmbl: tx.tokensmbl,
                                    tokenDcm: tx.tokendcm,
                                    tokenType: tx.tokentype,
                                    txFee: { val: tx.txfee, dcm: tx.tokendcm },
                                    gasUsed: tx.gasused,
                                    gasCost: tx.gascost,
                                })
                            ),
                        })) ||
                    resolve(check.get_msg()['404'])
            )
            .catch((e) => console.error(e) && resolve({ head: {} }));
    });

/** ERC20 holders */
exports.erc20holders = ({ size, offset, addr }) =>
    new Promise((resolve) => {
        console.log(`${wid_ptrn('erc20holders')}`);
        let query = { tokenaddr: addr };
        /** register Promises */
        const totalEntitiesP = count(erc20cache, query);
        const txsP = find(erc20cache, query, offset, size, { value: -1 });
        /** resolve in parallel */
        Promise.all([totalEntitiesP, txsP])
            .then(
                ([totalEntities, txs]) =>
                    (totalEntities &&
                        resolve({
                            head: { totalEntities: totalEntities, offset: offset, size: size, addr: addr, updateTime: moment() },
                            rows: txs.map((tx) =>
                                Object({
                                    id: tx._id,
                                    addr: tx.addr,
                                    name: tx.tokenname,
                                    smbl: tx.tokensmbl,
                                    balance: {
                                        val: tx.value,
                                        dcm: tx.tokendcm,
                                    },
                                    icon: '/api/icon/' + tx.tokenaddr,
                                })
                            ),
                        })) ||
                    resolve(check.get_msg()['404'])
            )
            .catch((e) => console.error(e) && resolve({ head: {}, rows: [] }));
    });

/** ERC20 market daily history */
exports.erc20market = ({ addr, size }) =>
    new Promise((resolve) => {
        console.log(`${wid_ptrn('erc20market')}`);
        let query = { addr: addr };
        /** register Promises */
        const marketsP = find(hour_market_stat_col, query, 0, size, { datetime: -1 });
        const tokenInfoP = findOne(token_head, query, { addr: 1, name: 1, smbl: 1, dcm: 1, _id: 0 });
        /** resolve in parallel */
        Promise.all([tokenInfoP, marketsP])
            .then(
                ([tokenHeader, market]) =>
                    (market &&
                        resolve({
                            head: {
                                ...tokenHeader,
                                updateTime: moment(),
                            },
                            rows: market.map((tx) =>
                                Object({
                                    price: tx.price,
                                    change: tx.change,
                                    datetime: tx.datetime,
                                })
                            ),
                        })) ||
                    resolve(check.get_msg()['404'])
            )
            .catch((e) => console.error(e) && resolve({ head: {}, rows: [] }));
    });
