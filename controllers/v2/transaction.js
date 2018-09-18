/*
 REST API v.2
 transaction controller
 */
const tnx_model = require('../../models/v2/transaction'),
    cluster = require('cluster'),
    cfg = require('../../config/config'),
    eth_col = cfg.store.cols.eth,
    token_col = cfg.store.cols.token,
    logger = require('../../utils/logger')(module),
    moment = require('moment'),
    check = require('../../utils/checker').cheker(),
    c = cfg.color;

// worker id pattern
const wid_ptrn = (endpoint) =>
    `${c.green}worker[${cluster.worker.id}]${c.red}[API v.2]${c.cyan}[transaction controller]${c.red} > ${c.green}[${endpoint}] ${
        c.white
    }`;

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

/** Check Tx parameters */
const checkTxParams = (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    let params = req.query || {};
    // params destructing
    let { offset, size } = params;
    offset = parseInt(offset); // convert to Number
    size = parseInt(size); // convert to Number
    // check params existing
    if (!offset && offset !== 0) {
        res.status(400).json(check.get_msg().no_offset);
        return false;
    } else if (!size) {
        res.status(400).json(check.get_msg().no_size);
        return false;
    }
    return check.normalize_pagination({}, size, offset);
};

const ChekHash = (clear_hash) => new Promise((resolve, reject) => (check.checkHash(clear_hash) ? resolve() : reject()));

/** [HTTP REST] (API v.2) GetLast Tokens Transactions endpoint*/
const GetLastTnxTokensRest = async (req, res) => {
    console.log(`${wid_ptrn('GetLastTnxEthRest')}`);
    let options = checkTxParams(req, res);
    if (options) {
        // add eth collection property
        options.collection = token_col;
        // get tokens collection name
        let response = await tnx_model.lastTransactions(options);
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
                    value: { val: tx.value, dcm: tx.tokendcm },
                    tokenAddr: tx.tokenaddr,
                    tokenName: tx.tokenname,
                    tokenSmbl: tx.tokensmbl,
                    tokenDcm: tx.tokendcm,
                    tokenType: tx.tokentype,
                    txFee: { val: tx.txfee, dcm: tx.tokendcm },
                    gasUsed: tx.gasused,
                    gasCost: tx.gascost,
                };
            });
            res.json(response);
        } else res.json(check.get_msg().not_found);
    }
};

/** [HTTP REST] (API v.2) GetLast ETH Transactions endpoint*/
const GetLastTnxEthRest = async (req, res) => {
    console.log(`${wid_ptrn('GetLastTnxEthRest')}`);
    let options = checkTxParams(req, res);
    if (options) {
        // add eth collection property
        options.collection = eth_col;
        // get ether collection name
        let response = await tnx_model.lastTransactions(options);
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
                    value: { val: tx.value, dcm: tx.tokendcm },
                    txFee: { val: tx.txfee, dcm: tx.tokendcm },
                    gasUsed: tx.gasused,
                    gasCost: tx.gascost,
                };
            });
            res.json(response);
        } else res.json(check.get_msg().not_found);
    }
};

/** common tx details*/
const txDetails = async (hash) => {
    try {
        let response = await tnx_model.details(hash); // get tx details by hash
        return response.hasOwnProperty('empty') ? check.get_msg().transaction_not_found : response; // setup response 404 if no data ('empty') or pass data
    } catch (e) {
        console.log(e);
        logger.error(e); // log exception
        return check.get_msg().transaction_not_found;
    }
};

/** Get Transaction details endpoint API v.2*/
const GetTnxDetailsRest = async (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    console.log(`${wid_ptrn('GetTnxDetailsRest')}`);
    let hash = req.query.hash;
    let clear_hash = check.cut0xClean(hash);
    ChekHash(clear_hash)
        .then(async () => {
            let response = await txDetails(clear_hash);
            if (response.hasOwnProperty('errorCode')) res.status(404);
            res.json(response);
        })
        .catch(() => res.status(400).json(check.get_msg().bad_hash(hash)));
};

/** socket.io Get Transaction details endpoint API v.2*/
const ioGetTnxDetails = async (hash) => {
    console.log(`${wid_ptrn('ioGetTnxDetails')}`);
    try {
        let response = await tnx_model.details(hash); // get tx details by hash
        return response.hasOwnProperty('empty') ? check.get_msg().transaction_not_found : response; // setup response 404 if no data ('empty') or pass data
    } catch (e) {
        console.log(e);
        logger.error(e); // log exception
        return check.get_msg().transaction_not_found;
    }
};

/** [Socket io] (API v.2) GetLast ETH Transactions endpoint*/
const ioGetLastTnxEth = async (options) => {
    console.log(`${wid_ptrn('ioGetLastTnxEthRest')}`);
    // add eth collection property
    options.collection = eth_col;
    // get ether collection name
    let response = await tnx_model.lastTransactions(options);
    if (response) {
        // preparing data (map data from model)
        response.head.updateTime = moment(); // UTC time format
        response.head.listId = 'listOfETH';
        response.head.moduleId = 'transactions';
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
                value: { val: tx.value, dcm: tx.tokendcm || 18 },
                txFee: { val: tx.txfee, dcm: tx.tokendcm || 18 },
                gasUsed: tx.gasused,
                gasCost: tx.gascost,
            };
        });
        return response;
    } else return check.get_msg().not_found;
};

/** [Socket.io] (API v.2) GetLast Tokens Transactions endpoint*/
const ioGetLastTnxTokens = async (options) => {
    console.log(`${wid_ptrn('ioGetLastTnxTokens')}`);
    // add eth collection property
    options.collection = token_col;
    // get tokens collection name
    let response = await tnx_model.lastTransactions(options);
    if (response) {
        // preparing data (map data from model)
        response.head.updateTime = moment(); // UTC time format
        response.head.listId = 'listOfTokens';
        response.head.moduleId = 'tokens';
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
                value: { val: tx.value, dcm: tx.tokendcm || 18 },
                tokenAddr: tx.tokenaddr,
                tokenName: tx.tokenname,
                tokenSmbl: tx.tokensmbl,
                tokenDcm: tx.tokendcm,
                tokenType: tx.tokentype,
                txFee: { val: tx.txfee, dcm: tx.tokendcm || 18 },
                gasUsed: tx.gasused,
                gasCost: tx.gascost,
            };
        });
        return response;
    } else return check.get_msg().not_found;
};

module.exports = {
    tokens: GetLastTnxTokensRest, // [HTTP REST] (API v.2) GetLast Tokens Transactions endpoint
    eth: GetLastTnxEthRest, // [HTTP REST] (API v.2) GetLast ETH Transactions endpoint
    details: GetTnxDetailsRest, // [HTTP REST] (API v.2) Get Transaction details endpoint
    io_details: ioGetTnxDetails, // [Socket.io] (API v.2) Get Transaction details endpoint
    io_eth: ioGetLastTnxEth, // [Socket.io] (API v.2) GetLast ETH Transactions endpoint
    io_tokens: ioGetLastTnxTokens, // [Socket.io] (API v.2) GetLast Tokens Transactions endpoint
};
