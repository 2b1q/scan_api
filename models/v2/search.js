const cluster = require('cluster'),
    cfg = require('../../config/config'),
    ethproxy = require('../../node_interaction/eth-proxy-client'),
    db = require('../../libs/db'),
    token_head = cfg.store.cols.token_head,
    block_head = cfg.store.cols.block,
    logger = require('../../utils/logger')(module),
    moment = require('moment'),
    c = cfg.color,
    block_range = 1000000,
    MAX_RESULT_SIZE = 1000;

/** worker id pattern */
const wid_ptrn = (msg) =>
    `${c.green}worker[${cluster.worker.id}]${c.red}[API v.2]${c.cyan}[search module]${c.red} > ${c.green}[${msg}] ${c.white}`;

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

/** range sequence generator */
function* range(start = 5000000, end = start + 100, step = 1) {
    let n = 0;
    for (let i = start; i < end; i += step) {
        n += 1;
        yield i;
    }
    return n;
}

/** search by block number model */
const searchBlock = ({ block_query, size }) =>
    new Promise((resolve) => {
        logger.model(logit('searchBlock', block_query));
        console.log(`${wid_ptrn('searchBlock query: ' + block_query)}`);
        if (isNaN(block_query)) resolve([]);
        db.get()
            .then((db_instance) => {
                if (!db_instance) resolve([]);
                db_instance
                    .collection(block_head)
                    .find({})
                    .sort({ block: -1 })
                    .limit(1)
                    .toArray((err, [{ block: max_block }]) => {
                        if (err) resolve([]);
                        console.log(`max_block in DB: ${max_block}`);
                        let arr = Array.from(Array(max_block + 1).keys()).filter((v) =>
                            v.toString().includes(block_query.toString())
                        );
                        // unshift first element then slice and splice
                        let first = arr.shift();
                        arr = arr.slice(-size + 1).reverse();
                        arr.splice(0, 0, first);
                        resolve(arr);
                    });
            })
            .catch((e) => {
                resolve([]);
                console.error(e);
                console.error('connection to MongoDB lost');
            });

        /*
        /!** last 10^6 sequence *!/
        resolve(
            [...range(max_block - block_range, max_block + 1)]
                .filter((v) => v.toString().includes(query.toString()))
                .map((v) => Object({ type: 'block', attributes: { block: v } }))
        );*/
    });

const findOneToken = (query) =>
    new Promise((resolve) =>
        db.get().then((db_instance) => {
            if (!db_instance) resolve();
            db_instance
                .collection(token_head)
                .findOne(query)
                .then((token) => {
                    console.log(token);
                    resolve(token);
                })
                .catch(() => resolve());
        })
    );

const findTokens = (query) =>
    new Promise((resolve) =>
        db.get().then((db_instance) => {
            if (!db_instance) resolve();
            db_instance
                .collection(token_head)
                .find(query)
                .toArray((err, docs) => {
                    if (err) resolve([]);
                    resolve(docs);
                });
        })
    );

/** search by token name model */
const searchToken = ({ token_query, size }) =>
    new Promise((resolve) => {
        logger.model(logit('searchToken', token_query));
        console.log(`${wid_ptrn('searchToken query: ' + token_query)}`);
        let token_regexp = new RegExp(`(^.*${token_query}.*)`, 'i');
        let q1 = { smbl: token_regexp };
        let q2 = { $or: [{ name: token_regexp }, { smbl: token_regexp }] };
        const p1 = findOneToken(q1);
        const p2 = findTokens(q2);
        Promise.all([p1, p2])
            .then(([r1, r2]) => {
                let first = { addr: r1.addr, name: r1.name, smbl: r1.smbl };
                let arr = r2.map((tkn) => Object({ addr: tkn.addr, name: tkn.name, smbl: tkn.smbl }));

                resolve([first, ...arr]);
            })
            .catch((e) => {
                console.error(e);
                resolve([]);
            });
    });

module.exports = {
    block: searchBlock,
    token: searchToken,
};
