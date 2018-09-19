const cluster = require('cluster'),
    cfg = require('../../config/config'),
    api_version = cfg.api_version,
    project = cfg.project,
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
        api_version: api_version,
        module: 'token controller',
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

/** polymorphic Check Address, size, offset parameters */
const checkAddrkParams = (req, res, { with_offset }) => {
    // log query data any way
    logger.api_requests(logit(req));
    let params = req.query || {};
    // params destructing
    let { addr, offset, size } = params;
    offset = parseInt(offset); // convert to Number
    size = parseInt(size); // convert to Number
    // check params existing
    if (!addr) {
        res.status(400).json(check.get_msg().no_addr);
        return false;
    } else if (!size) {
        res.status(400).json(check.get_msg().no_size);
        return false;
    }
    // polymorphic with_offset parameter
    if (with_offset && (!offset && offset !== 0)) {
        res.status(400).json(check.get_msg().no_offset);
        return false;
    }

    addr = check.cut0xClean(addr);
    if (check.checkAddr(addr)) return check.normalize_pagination({ addr: addr }, size, offset);
    else {
        res.status(400).json(check.get_msg().wrong_addr);
        return false;
    }
};

/** Check Address */
const checkAddr = (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    let addr = req.query.addr; // addr from request
    let c_addr = check.cut0xClean(addr); // cut 0x and clean address
    // check cleared address by length
    if (!check.checkAddr(c_addr, addr)) {
        if (!addr) return res.status(400).json(check.get_msg().no_addr); // if addr undefined
        res.status(400).json(check.get_msg().bad_addr(addr)); // if wrong addr format
    } else return c_addr;
};

/** ERC20 token info */
const erc20info = (req, res) => {
    console.log(`${wid_ptrn('erc20info')}`);
    let c_addr = checkAddr(req, res);
    c_addr &&
        token_module
            .erc20info(c_addr)
            .then((response) => (response.errorCode && res.status(404).json(response)) || res.json(response));
};

/** list token transactions */
const txlist = (req, res) => {
    console.log(`${wid_ptrn('txlist')}`);
    let options = checkAddrkParams(req, res, { with_offset: true });
    options &&
        token_module
            .erc20txlist(options)
            .then((response) => (response.errorCode && res.status(404).json(response)) || res.json(response));
};

/** ERC20 holders */
const holders = (req, res) => {
    console.log(`${wid_ptrn('holders')}`);
    let options = checkAddrkParams(req, res, { with_offset: true });
    options &&
        token_module
            .erc20holders(options)
            .then((response) => (response.errorCode && res.status(404).json(response)) || res.json(response));
};

/** Token market history */
const markethist = (req, res) => {
    console.log(`${wid_ptrn('markethist')}`);
    let options = checkAddrkParams(req, res, { with_offset: false });
    options &&
        token_module
            .erc20market(options)
            .then((response) => (response.errorCode && res.status(404).json(response)) || res.json(response));
};

module.exports = {
    erc20details: erc20info, // REST GET 'erc20/details' ERC20 token info
    txs: txlist, // REST GET 'erc20/transactions' list token transactions
    holders: holders, // REST GET 'erc20/holders' ERC20 holders
    market: markethist, // REST GET 'erc20/price' Token market history
};
