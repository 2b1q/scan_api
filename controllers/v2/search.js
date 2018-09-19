const cluster = require('cluster'),
    cfg = require('../../config/config'),
    api_version = cfg.api_version,
    project = cfg.project,
    logger = require('../../utils/logger')(module),
    search_model = require('../../models/v2/search'),
    moment = require('moment'),
    check = require('../../utils/checker').cheker(),
    c = cfg.color,
    MAX_RESULT_SIZE = 1000,
    DEFAULT_SIZE = 20;

/** worker id pattern */
const wid_ptrn = (msg) =>
    `${c.green}worker[${cluster.worker.id}]${c.red}[API v.2]${c.cyan}[search controller]${c.red} > ${c.green}[${msg}] ${c.white}`;

/** simple query logger */
let logit = (req, msg = '') => {
    return {
        msg: msg,
        api_version: api_version,
        module: 'search controller',
        project: project,
        post_params: req.body,
        get_params: req.query,
        timestamp: (() => moment())(),
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
    let { q, size = DEFAULT_SIZE } = params;
    size = isNaN(parseInt(size)) ? DEFAULT_SIZE : parseInt(size);
    size = size > MAX_RESULT_SIZE ? MAX_RESULT_SIZE : size;
    // check "q" parameter is exist OR !== 0
    if (!q || parseInt(q) === 0) {
        res.status(400).json(check.get_msg().bad_search_parameter(q));
        return false;
    }
    return {
        block_query: parseInt(q), // NaN if string started from chars
        token_query: q,
        size: size,
    };
};

/** Common REST API controller for Block/Token search */
const tokenOrBlockSearch = (req, res) => {
    console.log(`${wid_ptrn('tokenOrBlockSearch')}`);
    let query_params = checkSearchParams(req, res);
    if (query_params) {
        Promise.all([search_model.block(query_params), search_model.token(query_params)])
            .then(([blocks, tokens]) => {
                res.json({
                    blocks: blocks,
                    tokens: tokens,
                });
            })
            .catch(() => res.json({ blocks: [], tokens: [] }));
    }
};

module.exports = {
    tokenOrBlock: tokenOrBlockSearch, // [HTTP REST] (API v.2) tokenOrBlockSearch
};
