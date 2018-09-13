const cluster = require('cluster'),
    cfg = require('../../config/config'),
    logger = require('../../utils/logger')(module),
    token_module = require('../../models/v2/token'),
    moment = require('moment'),
    check = require('../../utils/checker').cheker(),
    c = cfg.color;

/** worker id pattern */
const wid_ptrn = (msg) =>
    `${c.green}worker[${cluster.worker.id}]${c.red}[API v.2]${c.cyan}[token controller]${c.red} > ${c.green}[${msg}] ${c.white}`;

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

/** Check parameters */
const checkSearchParams = (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    let params = req.query || {};
    // params destructing
    let { q, size = DEFAULT_SIZE } = params;
};

/** ERC20 token info */
const erc20info = (req, res) => {
    console.log(`${wid_ptrn('erc20info')}`);
    let addr = req.query.addr; // addr from request
    let c_addr = check.cut0xClean(addr); // cut 0x and clean address
    // check cleared address by length
    if (!check.checkAddr(c_addr, addr)) {
        if (!addr) return res.status(400).json(check.get_msg().no_addr); // if addr undefined
        res.status(400).json(check.get_msg().bad_addr(addr)); // if wrong addr format
    } else token_module.erc20info(c_addr).then((response) => res.json(response));
};

/** list token transactions */
const txlist = async (req, res) => {};

/** ERC20 holders */
const holders = async (req, res) => {};

/** Token market history */
const markethist = async (req, res) => {};

module.exports = {
    erc20details: erc20info,
    txs: txlist,
    holders: holders,
    market: markethist,
};
