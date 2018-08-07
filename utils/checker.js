/* Checker singleton pattern with closures
 *  - check API_KEY token (not used yet)
 *  - handy tools => check isFloat, isInteger
 *  - build page options => harcoded limits constants from (Go safePageAndSize)
 *  - get client msgs object
 *  - check is correct ListId, ModuleId, block
 */
const check_module_singleton = (() => {
    let instance; // keep reference to instance
    // init instance
    let initSingleton = () => {
        const cfg = require('../config/config');
        // WA
        const pagination = {
            min_offset: 0,
            max_offset: 300000,
            min_size: 1,
            max_size: 200,
        };
        // private constants
        const page = cfg.page,
            // pagination = cfg.pagination,
            MIN_PAGE = page.min_page,
            MAX_PAGE = page.max_page,
            MIN_SIZE = page.min_size,
            MAX_SIZE = page.max_size,
            MAX_SKIP = cfg.store.mongo.max_skip,
            // API v.2 pagination constants
            MAX_OFFSET = pagination.max_offset,
            MIN_OFFSET = pagination.min_offset,
            MIN_SZ = pagination.min_size,
            MAX_SZ = pagination.max_size;

        // client msgs
        const msg = {
            not_found: { head: {}, rows: [] }, // API v.2 & API v.1
            block_not_found: { errorCode: 404, errorMessage: 'Block not found' }, // API v.2
            transaction_not_found: { errorCode: 404, errorMessage: 'Transaction not found' }, // API v.2
            wrong_block: { errorCode: 400, errorMessage: 'Wrong block number' }, // API v.2
            no_offset: { errorCode: 400, errorMessage: 'parameter "offset" not found or wrong' }, // API v.2
            no_size: { errorCode: 400, errorMessage: 'parameter "size" not found or wrong' }, // API v.2
            no_addr: { errorCode: 400, errorMessage: 'parameter "addr" not found' }, // API v.2
            wrong_addr: { errorCode: 400, errorMessage: 'Wrong "addr" property' }, // API v.2
            unknown_listid: { error: 'Unknown listId' },
            no_api_key: { error: 'unable to set "api_key" param' },
            wrong_api_key: { error: 'bad "api_key"' },
            wrong_entityId: { error: 'Wrong entityId property' },
            wrong_listId: { error: 'Wrong listId property' },
            unknown_module_id: { error: 'Unknown moduleId' },
            no_entityId: { error: 'entityId not found' },
            no_blockNumber: { error: 'blockNumber not found' },
            bad_hash: (hash) => Object({ error: `Bad Hash value "${hash}"` }),
            bad_addr: (addr) => Object({ error: `Bad addr value "${addr}"` }),
        };
        // private functions
        let isFloat = (n) => n === +n && n !== (n | 0),
            isInteger = (n) => n === +n && n === (n | 0);
        // build page options (Go safePageAndSize "bkxscan/blob/master/main/api/main.go")
        let pageandsize = (p, s) => {
            let page = isNaN(p) ? 1 : Number(p).toFixed(); // default page = 1
            let size = isNaN(s) ? 20 : Number(s).toFixed(); // default size = 20 (if size 'undefined')
            page = Number(parseInt(page)); // avoid string
            size = Number(parseInt(size)); // avoid string
            // set page limits
            if (page < MIN_PAGE) page = MIN_PAGE;
            if (page > MAX_PAGE) page = MAX_PAGE;
            if (size < MIN_SIZE) size = MIN_SIZE;
            if (size > MAX_SIZE) size = MAX_SIZE;
            let skip = (page - 1) * size;
            if (skip > MAX_SKIP) page = MAX_SKIP / size;
            skip = (page - 1) * size;
            // return safePageAndSize
            return {
                skip: skip,
                size: size,
                page: page,
                sz: size, // BUG fix with distruct in c.68
                pg: page, // BUG fix with distruct in c.68
            };
        };

        // normalize (size, offset) params API v.2
        const normalize_size_offset = (obj, size, offset) => {
            if (size > MAX_SZ) size = MAX_SZ;
            if (size <= MIN_SZ) size = MIN_SZ;
            if (offset > MAX_OFFSET) offset = MAX_OFFSET;
            if (offset < MIN_OFFSET) offset = MIN_OFFSET;
            return {
                size: size,
                offset: offset,
                ...obj, // destruct obj {} (addr, block, hash)
            };
        };

        // // normalize addr params (pagesize, pagenumber)
        // let addr_opts = (addr, pagesize, pagenumber) => {
        //     let { skip, page, size } = pageandsize(pagenumber, pagesize);
        //     return {
        //         addr: addr,
        //         pageSize: size,
        //         pageNumber: page,
        //         skip: skip,
        //     };
        // };

        // build qury options
        let build_params = (req, listId, moduleId, entityId) => {
            let { page = 1, size = 10, filters } =
                req.body.params === undefined
                    ? { page: 1, size: 10, filters: {} } // default values if params = undefined
                    : req.body.params;
            // destruct object
            let { skip, sz, pg } = pageandsize(page, size);
            return {
                listId: listId,
                moduleId: moduleId,
                page: pg,
                skip: skip,
                size: sz,
                filters: filters,
                entityId: entityId,
            };
        };
        // build qury options
        let build_params_io = (params, listId, moduleId, entityId) => {
            let { page, size, skip, filters } =
                params === undefined
                    ? { page: 1, size: 20, skip: 0, filters: {} } // default values
                    : params;
            return {
                listId: listId,
                moduleId: moduleId,
                page: Number(parseInt(page)),
                skip: Number(parseInt(skip)),
                size: Number(parseInt(size)),
                filters: filters,
                entityId: entityId.length >= 40 ? entityId : Number(entityId), // if entityId length >= 40 its address else its block
            };
        };

        // check IF token exist
        let chek_token = (token) => cfg.restOptions.apiKeys.includes(token);
        // construct res object
        let send_response = function(res, msg, status) {
            res.status(status);
            res.json(msg);
        };

        // check AUTH by token
        let check_auth = (api_key, res) => {
            if (!api_key) send_response(res, msg.no_api_key, 401);
            else if (!chek_token(api_key)) send_response(res, msg.wrong_api_key, 401);
            else return true;
        };

        // TODO: chenge to regexp.test(str)
        // check hash from client request
        let check_Hash = (chash) => (chash.length === 64 ? true : false);

        // check addr from client request
        let check_addr = (caddr) => (caddr.length === 40 ? true : false);

        // check listId from client request
        let check_listId = (listId) =>
            Object.values(cfg.list_type).includes(listId) ? true : false;

        // check ModuleId from client request
        let check_moduleId = (moduleId) =>
            Object.values(cfg.modules).includes(moduleId) ? true : false;

        // check entityId from client request
        let check_entityId = (entityId = 0) => {
            return entityId !== 0 ? true : false;
        };

        // check block from client request
        let check_block = (block) => {
            return block > 0 ? true : false;
        };

        // check address from client request
        let check_addr_exist = (address, res) => {
            return address.length === 40 ? true : send_response(res, msg.wrong_addr, 404);
        };

        // hash operations
        // cut '0x' from hash string
        let cut_0x = (hash) => (typeof hash === 'string' ? hash.split('0x').pop() : '');

        // remove unexpected chars from hex
        let clean_Hex = (hash) =>
            typeof hash === 'string' ? hash.replace(/[^a-fA-F0-9]+/g, '') : '';

        // cut '0x' then remove unexpected chars from hex
        let cut0x_Clean = (hash) => clean_Hex(cut_0x(hash)).toLowerCase();

        // public interface
        return {
            normalize_pagination: (obj, size, offset) => normalize_size_offset(obj, size, offset),
            // isInt: (n) => isInteger(n), // handy tools
            // isFloat: (n) => isFloat(n), // handy tools
            safePageAndSize: (p, s) => pageandsize(p, s), // build page options => harcoded limits constants from (Go safePageAndSize)
            // apiToken: (token) => chek_token(token), // check API_KEY token (not used yet)
            // auth: (api_key, res) => check_auth(api_key, res), // auth using API_KEY token (not used yet)
            listId: (lid) => check_listId(lid), // check is correct ListId
            moduleId: (mid) => check_moduleId(mid), // check is correct ModuleId
            get_msg: () => msg, // get client msgs object
            // build_block_opts: (block, size, offset) => block_opts(block, size, offset), // API v.2 bulid block options
            // build_addr_opts: (addr, ps, pn) => addr_opts(addr, ps, pn), // API v.2 bulid block options
            build_options: (req, lid, mid, eid) => build_params(req, lid, mid, eid), // build query options
            build_io_opts: (params, listId, moduleId, entityId) =>
                build_params_io(params, listId, moduleId, entityId),
            cut0x: (hash) => cut_0x(hash), // cut '0x' from hash string
            cut0xClean: (hash) => cut0x_Clean(hash), // cut '0x' then remove unexpected chars from hex
            checkHash: (chash) => check_Hash(chash), // check hash from client request
            checkAddr: (caddr) => check_addr(caddr), // check address from client request
            entityId: (eid) => check_entityId(eid), // check entityId from client request
            block: (block) => check_block(block), // check block from client request
            addr: (address, res) => check_addr_exist(address, res), // check IS address exists from client request
        };
    };
    return {
        getInstance: () => {
            if (!instance) instance = initSingleton();
            return instance;
        },
    };
})();

module.exports.cheker = () => check_module_singleton.getInstance();
