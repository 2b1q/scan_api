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
const wid_ptrn = (endpoint) =>
    `${c.green}worker[${cluster.worker.id}]${c.red}[API v.2]${c.cyan}[address controller]${c.red} > ${c.green}[${endpoint}] ${c.white}`;

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

/** get Address details (REST API v.2)*/
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

/** get Address details (socket.io API v.2)*/
const io_GetAddr = async (address) => {
    try {
        let response = await addr_model.details(address);
        return response.hasOwnProperty('head') ? response : check.get_msg().not_found;
    } catch (e) {
        logger.error({ error: e, function: 'io_GetAddr' }); // log model error
        return check.get_msg().not_found; // don`t fwd errors from model to client
    }
};

/** Get Address ETH Transactions API v.2*/
const GetAddrEth = async (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    console.log(`${wid_ptrn('GetAddrEth')}`);
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

/** IO Get Address ETH Transactions API v.2*/
const ioGetAddrEth = async (options) => {
    console.log(`${wid_ptrn('io GetAddrEth')}`);
    // add eth collection property
    options.collection = eth_col;
    // get ether collection name
    let response = await addr_model.transactions(options);
    if (response) {
        // preparing data (map data from model)
        response.head.updateTime = moment(); // UTC time format
        response.head.moduleId = 'address';
        response.head.listId = 'listOfETH';
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
        return response;
    } else return check.get_msg().not_found;
};

/** Get Address Tokens Transactions API v.2*/
const GetAddrTokens = async (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    console.log(`${wid_ptrn('GetAddrTokens')}`);
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

/** io Get Address Tokens Transactions API v.2*/
const ioGetAddrTokens = async (options) => {
    console.log(`${wid_ptrn('io GetAddrTokens')}`);
    // add tokens collection property
    options.collection = token_col;
    // get ether collection name
    let response = await addr_model.transactions(options);
    if (response) {
        // preparing data (map data from model)
        response.head.updateTime = moment(); // UTC time format
        response.head.moduleId = 'address';
        response.head.listId = 'listOfTokens';
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
        return response;
    } else return check.get_msg().not_found;
};

/** Check Address parameters */
const checkAddrkParams = (req, res) => {
    // log query data any way
    logger.api_requests(logit(req));
    let params = req.query || {};
    // params destructing
    let { addr, offset, size } = params;
    offset = parseInt(offset); // convert to Number
    size = parseInt(size); // convert to Number
    // check params existing
    if (!offset && offset !== 0) {
        res.status(400).json(check.get_msg().no_offset);
        return false;
    } else if (!size) {
        res.status(400).json(check.get_msg().no_size);
        return false;
    } else if (!addr) {
        res.status(400).json(check.get_msg().no_addr);
        return false;
    }
    addr = check.cut0xClean(addr);
    if (check.checkAddr(addr)) return check.normalize_pagination({ addr: addr }, size, offset);
    else {
        res.status(400).json(check.get_msg().wrong_addr);
        return false;
    }
};

/** Get Address details REST API v.2*/
const GetAddrDetails = (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    console.log(`${wid_ptrn('GetAddrDetails')}`);
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

/** Get token Balance REST API v.2 */
const GetTokenBalance = async (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    console.log(`${wid_ptrn('GetTokenBalance')}`);
    let options = checkAddrkParams(req, res);
    if (options) {
        let response = await addr_model.tokenBalance(options);
        if (response) {
            // preparing data (map data from model)
            response.head.updateTime = moment(); // UTC time format
            response.rows = response.rows.map((token) => {
                return {
                    addr: token.addr,
                    name: token.name,
                    smbl: token.smbl,
                    dcm: token.dcm,
                    type: token.type,
                    balance: token.balance,
                    icon: token.icon,
                    dynamic: token.dynamic,
                };
            });
            res.json(response);
        } else res.json(check.get_msg().not_found);
    }
};

/** io Get token Balance REST API v.2 */
const ioGetTokenBalance = async (options) => {
    console.log(`${wid_ptrn('io GetTokenBalance')}`);
    let response = await addr_model.tokenBalance(options);
    if (response) {
        // preparing data (map data from model)
        response.head.updateTime = moment(); // UTC time format
        response.head.listId = 'listOfTokenBalance';
        response.head.moduleId = 'address';
        response.rows = response.rows.map((token) => {
            return {
                addr: token.addr,
                name: token.name,
                smbl: token.smbl,
                dcm: token.dcm,
                type: token.type,
                balance: token.balance,
                icon: token.icon,
                dynamic: token.dynamic,
            };
        });
        return response;
    } else return check.get_msg().not_found;
};

module.exports = {
    tokens: GetAddrTokens, // [HTTP REST] (API v.2) Get Address Tokens Transactions endpoint
    eth: GetAddrEth, // [HTTP REST] (API v.2) Get Address ETH Transactions endpoint
    details: GetAddrDetails, // [HTTP REST] (API v.2) Get Address details REST API endpoint
    tokenBalance: GetTokenBalance, // [HTTP REST] (API v.2) Get token Balance REST API endpoint
    io_details: io_GetAddr, // socket.io AddressDetails API v.2
    io_eth: ioGetAddrEth, // socket.io Address ETH txs API v.2
    io_tokens: ioGetAddrTokens, // socket.io Address Token txs API v.2
    io_tokenBalance: ioGetTokenBalance, // socket.io Address token Balance API v.2
};
