/* REST API v.2
 address controller
 */
const addr_model = require('../../models/v2/address'),
    logger = require('../../utils/logger')(module),
    moment = require('moment'),
    check = require('../../utils/checker').cheker(),
    cfg = require('../../config/config'),
    cluster = require('cluster'),
    c = cfg.color;

// worker id pattern
const wid_ptrn = (() => `${c.green}worker[${cluster.worker.id}]${c.cyan}[address controller][API v.2] ${c.white}`)();

// simple query logger
let logit = (req, msg = '') => {
    return {
        msg: msg,
        post_params: req.body,
        get_params: req.query,
        timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss'))(),
        path: module.filename.split('/').slice(-2).join('/')
    }
};


// common get address transaction func
const get_addr_tnxs = async (options, moduleId, listId, clearAddr) => {
    try{
        let response = await addr_model.transactions(options);
        if(response.rows.length > 0){
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
                updateTime: moment()
            };
            return response
        } else return check.get_msg().not_found
    } catch (e) {
        return { error: e }
    }
};


/* GetAddrTransactions from tnx_model (REST API + Socket IO)
 * if we have res object its REST request, otherwise its IO request
 */
const GetAddrTnx = async ({ listId, moduleId, page, size, entityId } = opts, res) => {
    console.log(`${wid_ptrn}`);
    let options = check.safePageAndSize(page, size); // build page, skip, size options
    options.listId = listId;                     // tx type (listOfETH/Tokens)
    options.entityId = entityId;                   // cleared address
    options.addr = entityId;                  // cleared address
    // get tnx db collection name by listId (IIFE + AF + ternary)
    options.collection = (listId => listId === 'listOfETH' ? 'ether_txn' : 'token_txn')(listId);
    logger.info({ addr: entityId });
    // if we have res object -> its REST API else ITS socket IO data
    if(res) res.json(await get_addr_tnxs(options, moduleId, listId, entityId));
    else return await get_addr_tnxs(options, moduleId, listId, entityId)
};


// check Address options (REST API). Set moduleId = 'address'
const checkOptions = (req, res, listId = '', moduleId = 'address') => {
    logger.api_requests(logit(req));               // log query data any way
    // if listId not passed then its addr details OR fail
    if(listId.length > 0){                       // check options
        let { entityId = 0 } = req.body.params || {}; // if entityId not set or no params => entityId = 0 => then "error":"entityId not found"
        // check entityId from client
        return check.entityId(entityId, res)
            ? check.build_options(req, listId, moduleId, entityId)
            : false
    } else { // if listId not passed then its Address details OR bad query
        let addr = req.body.addr || 0;
        console.log(addr);
        return check.addr(addr, res)
            ? addr
            : false
    }
};

// get Address details (REST API v.2)
const http_GetAddr = async (address, res) => {
    try{
        let response = await addr_model.details(address);
        if(!response.hasOwnProperty('head')) response = check.get_msg().not_found;
        res.json(response);
    } catch (e) {
        logger.error({ error: e, function: 'http_GetAddr' }) // log model error
        res.json(check.get_msg().not_found) // don`t fwd errors from model to client
    }
};

// Get Address Tokens Transactions
const GetAddrTokens = (req, res) => {
    console.log(`${wid_ptrn}`);
    let options = checkOptions(req, res, cfg.list_type.token);
    if(options) GetAddrTnx(options, res)
};

// Get Address ETH Transactions
const GetAddrEth = (req, res) => {
    console.log(`${wid_ptrn}`);
    let options = checkOptions(req, res, cfg.list_type.eth);
    if(options) GetAddrTnx(options, res)
};

// Get Address details REST API v.2
const GetAddrDetails = (req, res) => {
    logger.api_requests(logit(req));    // log query data any way
    console.log(`${wid_ptrn}`);
    let addr = req.query.addr;         // addr from request
    let c_addr = check.cut0xClean(addr) // cut 0x and clean address
    // check cleared address by length
    if(!check.checkAddr(c_addr, addr)){
        if(!addr) return res.status(400).json(check.get_msg().no_addr) // if addr undefined
        res.status(400).json(check.get_msg().bad_addr(addr)) // if wrong addr format
    } else {
        console.log({ addr: addr, cleared_addr: c_addr });
        http_GetAddr(c_addr, res)
    }
};


module.exports = {
    // tokens: GetAddrTokens,              // [HTTP REST] (API v.2) Get Address Tokens Transactions endpoint
    // eth: GetAddrEth,                    // [HTTP REST] (API v.2) Get Address ETH Transactions endpoint
    details: GetAddrDetails,            // [HTTP REST] (API v.2) Get Address details REST API endpoint
};
