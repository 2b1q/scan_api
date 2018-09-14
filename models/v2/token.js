const cluster = require('cluster'),
    cfg = require('../../config/config'),
    moment = require('moment'),
    ethproxy = require('../../node_interaction/eth-proxy-client'),
    db = require('../../libs/db'),
    check = require('../../utils/checker').cheker(),
    token_head = cfg.store.cols.token_head,
    erc20cache = cfg.store.cols.erc20_cache,
    token_col = cfg.store.cols.token,
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

/** findQuery*/
const find = (collection, query, skip, limit) =>
    new Promise(
        (resolve, reject) =>
            db
                .get()
                .then((db_instance) => {
                    if (!db_instance) resolve();
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
        /** resolve in parallel */
        Promise.all([totalHoldersP, tokenInfoP])
            .then(
                ([thp, tokenHeader]) =>
                    (thp && resolve({ head: { ...tokenHeader, totalSupply: 0, totalHolders: thp, overview: '' } })) ||
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
                                    value: tx.value,
                                    tokenAddr: tx.tokenaddr,
                                    tokenName: tx.tokenname,
                                    tokenSmbl: tx.tokensmbl,
                                    tokenDcm: tx.tokendcm,
                                    tokenType: tx.tokentype,
                                    txFee: tx.txfee,
                                    dcm: tx.tokendcm,
                                    gasUsed: tx.gasused,
                                    gasCost: tx.gascost,
                                })
                            ),
                        })) ||
                    resolve(check.get_msg()['404'])
            )
            .catch((e) => console.error(e) && resolve({ head: {} }));
    });
