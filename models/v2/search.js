const cluster = require('cluster'),
    cfg = require('../../config/config'),
    ethproxy = require('../../node_interaction/eth-proxy-client'),
    token_head = cfg.store.cols.token_head,
    logger = require('../../utils/logger')(module),
    moment = require('moment'),
    c = cfg.color,
    block_range = 1000000,
    MAX_RESULT_SIZE = 300000;

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
const searchBlock = (query) =>
    new Promise(async (resolve, reject) => {
        logger.model(logit('searchBlock', query));
        console.log(`${wid_ptrn('searchBlock query: ' + query)}`);
        let max_block = Math.max(...(await ethproxy.getStatus()));
        let result = Array.from(Array(max_block + 1).keys())
            .filter((v) => v.toString().includes(query.toString()))
            .map((v) => Object({ type: 'block', attributes: { block: v } }));
        /** slice from end MAX_RESULT_SIZE if > MAX_RESULT_SIZE */
        resolve(result.length > MAX_RESULT_SIZE ? result.slice(-MAX_RESULT_SIZE) : result);
        /*
        /!** last 10^6 sequence *!/
        resolve(
            [...range(max_block - block_range, max_block + 1)]
                .filter((v) => v.toString().includes(query.toString()))
                .map((v) => Object({ type: 'block', attributes: { block: v } }))
        );*/
    });

/** search by token name model */
const searchToken = (query) =>
    new Promise((resolve, reject) => {
        logger.model(logit('searchToken', query));
        console.log(`${wid_ptrn('searchToken query: ' + query)}`);
        resolve({ query: query, api: 'searchToken' });
    });

module.exports = {
    block: searchBlock,
    token: searchToken,
};
