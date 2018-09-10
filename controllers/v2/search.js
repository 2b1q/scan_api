const cluster = require('cluster'),
    cfg = require('../../config/config'),
    token_head = cfg.store.cols.token_head,
    logger = require('../../utils/logger')(module),
    moment = require('moment'),
    check = require('../../utils/checker').cheker(),
    c = cfg.color;

/** worker id pattern */
const wid_ptrn = (msg) =>
    `${c.green}worker[${cluster.worker.id}]${c.red}[API v.2]${c.cyan}[search controller]${c.red} > ${c.green}[${msg}] ${c.white}`;

/** simple query logger */
let logit = (req, msg = '') => {
    return {
        msg: msg,
        post_params: req.body,
        get_params: req.query,
        timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss'))(),
        path: module.filename
            .split('/')
            .slice(-2)
            .join('/'),
    };
};

/** Check Tx parameters */
const checkSearchParams = (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    let params = req.query || {};
    // params destructing
    let { q } = params;
    // check "q" parameter is exist OR !== 0
    if (!q || parseInt(q) === 0) {
        res.status(400).json(check.get_msg().bad_search_parameter(q));
        return false;
    }
    let isBlock = !isNaN(parseInt(q)); // check query search is block
    return {
        block: isBlock,
        query: isBlock ? parseInt(q) : q, // if q isBlock => parseInt
    };
};

/** search by block number */
const searchBlock = (block) => new Promise((resolve, rexject) => {});

/** search by Token name*/
const searchToken = (token) => new Promise((resolve, rexject) => {});

/** Common controller for Block/Token search */
const tokenOrBlockSearch = async (req, res) => {
    console.log(`${wid_ptrn('GetLastTnxEthRest')}`);
    let query_params = checkSearchParams(req, res);
    if (query_params) res.json(query_params); // todo searchToken OR searchBlock
};

module.exports = {
    tokenOrBlock: tokenOrBlockSearch, // [HTTP REST] (API v.2) tokenOrBlockSearch
};
