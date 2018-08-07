/* REST API v.2
 address controller
 */
const addr_model = require('../../models/v2/address'),
    logger = require('../../utils/logger')(module),
    moment = require('moment'),
    check = require('../../utils/checker').cheker(),
    cfg = require('../../config/config'),
    eth_col = cfg.store.cols.eth,
    token_col = cfg.store.cols.token,
    erc_20_col = cfg.store.cols.erc20_cache,
    cluster = require('cluster'),
    c = cfg.color;

// worker id pattern
const wid_ptrn = (() =>
    `${c.green}worker[${cluster.worker.id}]${c.cyan}[address controller][API v.2] ${c.white}`)();

// simple query logger
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

// common get address transaction func
const get_addr_tnxs = async (options, moduleId, listId, clearAddr) => {
    try {
        let response = await addr_model.transactions(options);
        if (response.rows.length > 0) {
            let { count, page, size, skip } = response;
            delete response.size;
            delete response.page;
            delete response.count;
            delete response.skip;
            response.head = {
                totalEntities: count,
                pageNumber: page,
                pageSize: size,
                skip: skip,
                moduleId: moduleId,
                listId: listId,
                entityId: clearAddr,
                updateTime: moment(),
            };
            return response;
        } else return check.get_msg().not_found;
    } catch (e) {
        return { error: e };
    }
};

// get Address details (REST API v.2)
const http_GetAddr = async (address, res) => {
    try {
        let response = await addr_model.details(address);
        if (!response.hasOwnProperty('head')) response = check.get_msg().not_found;
        res.json(response);
    } catch (e) {
        logger.error({ error: e, function: 'http_GetAddr' }); // log model error
        res.json(check.get_msg().not_found); // don`t fwd errors from model to client
    }
};

// Get Address ETH Transactions API v.2
const GetAddrEth = async (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    console.log(`${wid_ptrn}`);
    let options = checkAddrkParams(req, res);
    if (options) {
        // add eth collection property
        options.collection = eth_col;
        // get ether collection name
        let response = await addr_model.transactions(options);
        if (response) {
            // preparing data (map data from model)
            response.head.updateTime = moment(); // UTC time format
            response.rows = response.rows.map((tx) => {
                return {
                    id: tx._id,
                    hash: tx.hash,
                    block: tx.block,
                    addrFrom: tx.addrfrom,
                    addrTo: tx.addrto,
                    time: tx.isotime,
                    type: tx.type,
                    status: tx.status,
                    error: tx.error,
                    isContract: tx.iscontract,
                    isInner: tx.isinner,
                    value: tx.value,
                    txFee: tx.txfee,
                    dcm: tx.tokendcm,
                    gasUsed: tx.gasused,
                    gasCost: tx.gascost,
                };
            });
            res.json(response);
        } else res.json(check.get_msg().not_found);
    }
};

// Get Address Tokens Transactions API v.2
const GetAddrTokens = async (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    console.log(`${wid_ptrn}`);
    let options = checkAddrkParams(req, res);
    if (options) {
        // add tokens collection property
        options.collection = token_col;
        // get ether collection name
        let response = await addr_model.transactions(options);
        if (response) {
            // preparing data (map data from model)
            response.head.updateTime = moment(); // UTC time format
            response.rows = response.rows.map((tx) => {
                return {
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
                };
            });
            res.json(response);
        } else res.json(check.get_msg().not_found);
    }
};

const checkAddrkParams = (req, res) => {
    console.log(`${wid_ptrn}`);
    // log query data any way
    logger.api_requests(logit(req));
    let params = req.query || {};
    // params destructing
    let { addr, pageNumber, pageSize, offset, count } = params; // TODO add offset & count support for iOS pagination
    // check params existing
    if (!pageNumber) {
        res.status(400).json(check.get_msg().no_pageNumber);
        return false;
    } else if (!pageSize) {
        res.status(400).json(check.get_msg().no_pageSize);
        return false;
    } else if (!addr) {
        res.status(400).json(check.get_msg().no_addr);
        return false;
    }
    addr = check.cut0xClean(addr);
    if (check.checkAddr(addr)) {
        pageSize = parseInt(pageSize); // convert to Number
        pageNumber = parseInt(pageNumber); // convert to Number
        return check.build_addr_opts(addr, pageSize, pageNumber); // return options object
    } else {
        res.status(400).json(check.get_msg().wrong_addr);
        return false;
    }
};

// Get Address details REST API v.2
const GetAddrDetails = (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    console.log(`${wid_ptrn}`);
    let addr = req.query.addr; // addr from request
    let c_addr = check.cut0xClean(addr); // cut 0x and clean address
    // check cleared address by length
    if (!check.checkAddr(c_addr, addr)) {
        if (!addr) return res.status(400).json(check.get_msg().no_addr); // if addr undefined
        res.status(400).json(check.get_msg().bad_addr(addr)); // if wrong addr format
    } else {
        console.log({ addr: addr, cleared_addr: c_addr });
        http_GetAddr(c_addr, res);
    }
};

module.exports = {
    tokens: GetAddrTokens, // [HTTP REST] (API v.2) Get Address Tokens Transactions endpoint
    eth: GetAddrEth, // [HTTP REST] (API v.2) Get Address ETH Transactions endpoint
    details: GetAddrDetails, // [HTTP REST] (API v.2) Get Address details REST API endpoint
};
