const cluster = require('cluster'),
    cfg = require('../../config/config'),
    ethproxy = require('../../node_interaction/eth-proxy-client'),
    db = require('../../libs/db'),
    token_head = cfg.store.cols.token_head,
    block_head = cfg.store.cols.block,
    logger = require('../../utils/logger')(module),
    moment = require('moment'),
    c = cfg.color,
    MAX_RESULT_SIZE = cfg.search.MAX_RESULT_SIZE,
    SBLOCK = 'Block searching time',
    STOK = 'Token searching time';

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
    for (let i = start; i <= end; i += step) {
        n += 1;
        yield i;
    }
    return n;
}

/** search by block number model */
const searchBlock = ({ block_query, size }) =>
    new Promise((resolve, reject) => {
        logger.model(logit('searchBlock', block_query));
        console.log(`${wid_ptrn('searchBlock query: ' + block_query)}`);
        console.time(SBLOCK);
        if (isNaN(block_query)) {
            console.timeEnd(SBLOCK);
            return resolve([]);
        }
        db.get()
            .then((db_instance) => {
                if (!db_instance) return resolve([]);
                db_instance
                    .collection(block_head)
                    .find({})
                    .sort({ block: -1 })
                    .limit(1)
                    .toArray((err, [{ block: max_block }]) => {
                        if (err) return reject(err); // handle error on DB query crash
                        console.log(`max_block in DB: ${max_block}`);
                        let arr = [...range(max_block - MAX_RESULT_SIZE + 1, max_block)]; // generate MAX_RESULT_SIZE items
                        arr = arr.filter((v) => v.toString().includes(block_query.toString()));
                        arr.splice(0, arr.length - size, block_query); // remove (arr.length - size) and insert first element
                        arr.length > 1 && arr.pop(); // remove last element
                        console.timeEnd(SBLOCK);
                        resolve(arr);
                    });
            })
            .catch((e) => reject(e)); // handle error if no DB connection
    });

/** find tokens by query pattern */
const findTokens = (query, size, fields) =>
    new Promise(
        (resolve, reject) =>
            db
                .get()
                .then((db_instance) => {
                    if (!db_instance) return resolve();
                    db_instance
                        .collection(token_head)
                        .find(query, { fields })
                        .limit(size)
                        .toArray((err, tokens) => {
                            if (err) reject(err);
                            resolve(tokens);
                        });
                })
                .catch((e) => reject(e)) // handle error if no DB connection
    );

/** search by token name model */
const searchToken = ({ token_query, size }) =>
    new Promise((resolve) => {
        logger.model(logit('searchToken', token_query));
        console.log(`${wid_ptrn('searchToken query: ' + token_query)}`);
        // let token_regexp = new RegExp(`(^.*${token_query}.*)`, 'i');
        // let query_pattern = { $or: [{ name: token_regexp }, { smbl: token_regexp }] };
        let query_pattern = { $text: { $search: token_query } };
        console.time(STOK);
        findTokens(query_pattern, size, { addr: 1, smbl: 1, name: 1, _id: 0 })
            .then((tokens) => {
                console.timeEnd(STOK);
                resolve(tokens);
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
