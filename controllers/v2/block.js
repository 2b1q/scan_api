/* REST API v.2
 block controller
 */
const block_model = require('../../models/v2/block'),
    logger = require('../../utils/logger')(module),
    moment = require('moment'),
    check = require('../../utils/checker').cheker(),
    cfg = require('../../config/config'),
    api_version = cfg.api_version,
    project = cfg.project,
    cluster = require('cluster'),
    c = cfg.color,
    ETHDCM = cfg.constants.ethdcm,
    TOKENDCM = cfg.constants.tokendcm,
    FEEDCM = cfg.constants.feedcm;

// worker id pattern
const wid_ptrn = (() => `${c.green}worker[${cluster.worker.id}]${c.cyan}[block controller][API v.2] ${c.white}`)();

let logit = (req, msg = '') => {
    return {
        msg: msg,
        api_version: api_version,
        module: 'block controller',
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

// get block details API v.2
const http_GetBlock = async (block, res) => {
    console.log(`${wid_ptrn}`);
    try {
        let response = await block_model.details(block);
        // if response has 'error' property fwd response 404 else return 200 and payload
        if (response.hasOwnProperty('error')) res.status(404).json(check.get_msg().block_not_found);
        else res.json(response);
    } catch (e) {
        logger.error(e); // log error returned from model
        res.status(404).json(check.get_msg().block_not_found); // dont fwd exception to client
    }
};

// get block details IO API v.2
const io_GetBlock = async (block) => {
    console.log(`${wid_ptrn}`);
    try {
        let response = await block_model.details(block);
        // if response has 'error' property fwd response 404 else return 200 and payload
        return response.hasOwnProperty('error') ? check.get_msg().block_not_found : response;
    } catch (e) {
        logger.error(e); // log error returned from model
        return check.get_msg().block_not_found; // dont fwd exception to client
    }
};

// check options function (getBlock ETH/Tokens)
const checkBlockParams = (req, res) => {
    console.log(`${wid_ptrn}`);
    // log query data any way
    logger.api_requests(logit(req));
    let params = req.query || {};
    // params destructing
    let { blockNumber, offset, size } = params;
    size = parseInt(size); // convert to Number
    offset = parseInt(offset); // convert to Number
    // check params existing
    if (!offset && offset !== 0) {
        res.status(400).json(check.get_msg().no_offset);
        return false;
    } else if (!size) {
        res.status(400).json(check.get_msg().no_size);
        return false;
    } else if (!blockNumber) {
        res.status(400).json(check.get_msg().no_blockNumber);
        return false;
    }
    let block = parseInt(check.cut0xClean(blockNumber)); // cut 0x (avoid hex to int convertion)
    if (check.block(block)) return check.normalize_pagination({ block: block }, size, offset);
    else {
        res.status(400).json(check.get_msg().wrong_block);
        return false;
    }
};

// io get ETH block tnxs API v.2
const io_GetBlockEth = async (options) => {
    console.log(`${wid_ptrn}`);
    if (options) {
        // add eth collection property
        options.collection = cfg.store.cols.eth;
        // get ether collection name
        let response = await block_model.transactions(options);
        if (response) {
            // preparing data (map data from model)
            response.head.updateTime = moment(); // UTC time format
            response.head.listId = 'listOfETH';
            response.head.moduleId = 'block';
            response.head.entityId = options.block;
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
                    value: { val: tx.value, dcm: ETHDCM },
                    txFee: { val: tx.txfee, dcm: FEEDCM },
                    gasUsed: tx.gasused,
                    gasCost: tx.gascost,
                };
            });
            return response;
        } else return check.get_msg().not_found;
    }
};

// io get Tokens block tnxs API v.2
const io_GetBlockTokens = async (options) => {
    console.log(`${wid_ptrn}`);
    if (options) {
        // add tokens collection property
        options.collection = cfg.store.cols.token;
        // get tokens collection name
        let response = await block_model.transactions(options);
        if (response) {
            // preparing data (map data from model)
            response.head.updateTime = moment(); // UTC time format
            response.head.listId = 'listOfTokens';
            response.head.moduleId = 'block';
            response.head.entityId = options.block;
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
                    value: { val: tx.value, dcm: tx.tokendcm || TOKENDCM },
                    txFee: { val: tx.txfee, dcm: FEEDCM },
                    tokenAddr: tx.tokenaddr,
                    tokenName: tx.tokenname,
                    tokenSmbl: tx.tokensmbl,
                    tokenType: tx.tokentype,
                    gasUsed: tx.gasused,
                    gasCost: tx.gascost,
                };
            });
            return response;
        } else return check.get_msg().not_found;
    }
};

// Get block ETH Transactions API v.2
const GetBlockEth = async (req, res) => {
    let options = checkBlockParams(req, res);
    if (options) {
        // add eth collection property
        options.collection = cfg.store.cols.eth;
        // get ether collection name
        let response = await block_model.transactions(options);
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
                    value: { val: tx.value, dcm: ETHDCM },
                    txFee: { val: tx.txfee, dcm: FEEDCM },
                    gasUsed: tx.gasused,
                    gasCost: tx.gascost,
                };
            });
            res.json(response);
        } else res.json(check.get_msg().not_found);
    }
};

// Get block Tokens Transactions API v.2
const GetBlockTokens = async (req, res) => {
    let options = checkBlockParams(req, res);
    if (options) {
        // add tokens collection property
        options.collection = cfg.store.cols.token;
        // get tokens collection name
        let response = await block_model.transactions(options);
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
                    value: { val: tx.value, dcm: tx.tokendcm || TOKENDCM },
                    txFee: { val: tx.txfee, dcm: FEEDCM },
                    tokenAddr: tx.tokenaddr,
                    tokenName: tx.tokenname,
                    tokenSmbl: tx.tokensmbl,
                    tokenDcm: tx.tokendcm,
                    tokenType: tx.tokentype,
                    gasUsed: tx.gasused,
                    gasCost: tx.gascost,
                };
            });
            res.json(response);
        } else res.json(check.get_msg().not_found);
    }
};

// Get block details API v.2
const GetBlockDetails = (req, res) => {
    logger.api_requests(logit(req)); // log query data any way
    let block = req.query.block || 0;
    block = parseInt(check.cut0xClean(block)); // cut 0x (avoid hex to int convertion)
    if (check.block(block)) http_GetBlock(block, res);
    else res.status(400).json(check.get_msg().wrong_block);
};

module.exports = {
    tokens: GetBlockTokens, // [HTTP GET REST] (API v.2) Get block Tokens Transactions endpoint
    eth: GetBlockEth, // [HTTP GET REST] (API v.2) Get block ETH Transactions endpoint
    details: GetBlockDetails, // [HTTP GET REST] (API v.2) Get block details endpoint
    io_details: io_GetBlock, // socket io controller
    io_eth: io_GetBlockEth, // socket io controller
    io_tokens: io_GetBlockTokens, // socket io controller
};
