const cluster = require('cluster'),
    cfg = require('../../config/config'),
    ethproxy = require('../../node_interaction/eth-proxy-client'),
    db = require('../../libs/db'),
    token_head = cfg.store.cols.token_head,
    erc20cache = cfg.store.cols.erc20_cache,
    logger = require('../../utils/logger')(module),
    moment = require('moment'),
    c = cfg.color;

/** worker id pattern */
const wid_ptrn = (msg) =>
    `${c.green}worker[${cluster.worker.id}]${c.red}[API v.2]${c.cyan}[token module]${c.red} > ${c.green}[${msg}] ${c.white}`;

/** simple query logger */
let logit = (api, query) => {
    return {
        query: query,
        api: api,
        timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss'))(),
        path: module.filename
            .split('/')
            .slice(-2)
            .join('/'),
    };
};

/** findQuery*/
const findOne = (collection, query) =>
    new Promise((resolve) =>
        db.get().then((db_instance) => {
            if (!db_instance) resolve();
            db_instance
                .collection(collection)
                .findOne(query)
                .then((doc) => resolve(doc))
                .catch((e) => {
                    console.error(e);
                    resolve();
                });
        })
    );

/** counter */
const count = (collection, query) =>
    new Promise((resolve) =>
        db.get().then((db_instance) => {
            if (!db_instance) resolve();
            db_instance
                .collection(collection)
                .count(query)
                .then((cnt) => resolve(cnt))
                .catch((e) => {
                    console.error(e);
                    resolve();
                });
        })
    );

exports.erc20info = (addr) =>
    new Promise((resolve) => {
        const totalHoldersP = count(erc20cache, { tokenaddr: addr });
        const tokenInfoP = findOne(token_head, { addr: addr, type: 20 });
        Promise.all([totalHoldersP, tokenInfoP])
            .then(([thp, info]) => resolve({ totalHolders: thp, tokenHeader: info }))
            .catch((e) => {
                console.error(e);
                resolve({});
            });
    });
