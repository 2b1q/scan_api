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
        // private constants
        const cfg = require('../config/config');
        const pagination = cfg.pagination;
        // API v.2 pagination constants
        const MAX_OFFSET = pagination.max_offset,
            MIN_OFFSET = pagination.min_offset,
            MIN_SZ = pagination.min_size,
            MAX_SZ = pagination.max_size;
        // client msgs
        const msg = {
            not_found: { head: {}, rows: [] }, // API v.2 & API v.1
            404: { errorCode: 404, errorMessage: 'Not found' }, // API v.2
            block_not_found: { errorCode: 404, errorMessage: 'Block not found' }, // API v.2
            transaction_not_found: { errorCode: 404, errorMessage: 'Transaction not found' }, // API v.2
            wrong_block: { errorCode: 400, errorMessage: 'Wrong block number' }, // API v.2
            no_offset: { errorCode: 400, errorMessage: 'parameter "offset" not found or wrong' }, // API v.2
            no_size: { errorCode: 400, errorMessage: 'parameter "size" not found or wrong' }, // API v.2
            no_addr: { errorCode: 400, errorMessage: 'parameter "addr" not found' }, // API v.2
            no_jwt: { errorCode: 401, errorMessage: 'invalid token' }, // API v.2
            wrong_addr: { errorCode: 400, errorMessage: 'Wrong "addr" property' }, // API v.2
            no_blockNumber: { error: 'blockNumber not found' }, // API v.2
            bad_search_parameter: (q) => Object({ errorCode: 400, errorMessage: `Wrong "q" property: "${q}"` }), // API v.2
            bad_hash: (hash) => Object({ errorCode: 400, errorMessage: `Bad Hash value "${hash}"` }), // API v.2
            wrong_io_params: { errorCode: 400, errorMessage: 'Wrong "parameters" ' }, // API v.2
            unknown_listid_io: { errorCode: 404, errorMessage: 'Unknown listId' }, // API v.2
            bad_addr: (addr) => Object({ error: `Bad addr value "${addr}"` }),
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
        // construct res object
        let send_response = function(res, msg, status) {
            res.status(status);
            res.json(msg);
        };
        // check hash from client request
        let check_Hash = (chash) => (chash.length === 64 ? true : false);
        // check addr from client request
        let check_addr = (caddr) => (caddr.length === 40 ? true : false);
        // check listId from client request
        let check_listId = (listId) => (Object.values(cfg.list_type).includes(listId) ? true : false);
        // check ModuleId from client request
        let check_moduleId = (moduleId) => (Object.values(cfg.modules).includes(moduleId) ? true : false);
        // check entityId from client request
        let check_entityId = (entityId = 0) => (entityId !== 0 ? true : false);
        // check block from client request
        let check_block = (block) => (block > 0 ? true : false);
        // check address from client request
        let check_addr_exist = (address, res) => {
            return address.length === 40 ? true : send_response(res, msg.wrong_addr, 404);
        };

        // hash operations
        // cut '0x' from hash string
        let cut_0x = (hash) => (typeof hash === 'string' ? hash.split('0x').pop() : '');

        // remove unexpected chars from hex
        let clean_Hex = (hash) => (typeof hash === 'string' ? hash.replace(/[^a-fA-F0-9]+/g, '') : '');

        // cut '0x' then remove unexpected chars from hex
        let cut0x_Clean = (hash) => clean_Hex(cut_0x(hash)).toLowerCase();

        // public interface
        return {
            normalize_pagination: (obj, size, offset) => normalize_size_offset(obj, size, offset),
            listId: (lid) => check_listId(lid), // check is correct ListId
            moduleId: (mid) => check_moduleId(mid), // check is correct ModuleId
            get_msg: () => msg, // get client msgs object
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
