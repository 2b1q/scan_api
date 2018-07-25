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
    // private constants
    const page = cfg.page,
          MIN_PAGE = page.min_page,
          MAX_PAGE = page.max_page,
          MIN_SIZE = page.min_size,
          MAX_SIZE = page.max_size,
          MAX_SKIP = cfg.store.mongo.max_skip;
    // client msgs
    const msg = {
      not_found:            {error: 'Not found', Head: {}, Rows: []},
      unknown_listid:       {error: 'Unknown listId'},
      no_api_key:           {error: 'unable to set "api_key" param' },
      wrong_api_key:        {error: 'bad "api_key"' },
      wrong_block:          {error: 'Wrong block number'},
      wrong_addr:           {error: 'Wrong addr property'},
      wrong_entityId:       {error: 'Wrong entityId property'},
      wrong_listId:         {error: 'Wrong listId property'},
      unknown_module_id:    {error: 'Unknown moduleId'},
      no_entityId:          {error: 'entityId not found'},
      bad_hash:             hash => Object({error: `Bad Hash value "${hash}"`}),
      bad_addr:             addr => Object({error: `Bad addr value "${addr}"`})
    };
    // private functions
    let isFloat = n => n === +n && n !== (n|0),
        isInteger = n => n === +n && n === (n|0);
    // build page options (Go safePageAndSize "bkxscan/blob/master/main/api/main.go")
    let pageandsize = (p, s) => {
          let page = (isNaN(p)) ? 1 :  Number (p).toFixed(); // default page = 1
          let size = (isNaN(s)) ? 20 : Number (s).toFixed(); // default size = 20 (if size 'undefined')
          // set page limits
          if(page < MIN_PAGE) page = MIN_PAGE;
          if(page > MAX_PAGE) page = MAX_PAGE;
          if(size < MIN_SIZE) size = MIN_SIZE;
          if(size > MAX_SIZE) size = MAX_SIZE;
          let skip = (page - 1) * size;
          if(skip > MAX_SKIP) page = MAX_SKIP / size;
          skip = (page - 1) * size;
          // return safePageAndSize
          return {
              skip: Number (skip),
              size: Number (size), // avoid string
              page: Number (page)  // avoid string
          }
      };

    // build qury options
    let build_params = (req, listId, moduleId, entityId) => {
      let { page, size, filters } = req.body.params === undefined
        ? { page: 1, size: 20, filters: {} } // default values
        : req.body.params;
      let { skip, s = size, p = page } = pageandsize(page, size)
      return {
        listId:   listId,
        moduleId: moduleId,
        page:     p,
        skip:     skip,
        size:     s,
        filters:  filters,
        entityId: entityId
      }
    };
    // build qury options
    let build_params_io = (params, listId, moduleId, entityId) => {
      let { page, size, skip, filters } = params === undefined
        ? { page: 1, size: 20, skip: 0, filters: {} } // default values
        : params;
      return {
        listId:   listId,
        moduleId: moduleId,
        page:     Number (parseInt(page)),
        skip:     Number (parseInt(skip)),
        size:     Number (parseInt(size)),
        filters:  filters,
        entityId: entityId.length >= 40 ? entityId : Number (entityId) // if entityId length >= 40 its address else its block
      }
    };


    // check IF token exist
    let chek_token = token => cfg.restOptions.apiKeys.includes(token);
    // construct res object
    let send_response = function(res, msg, status) {
      res.status(status);
      res.json(msg)
    };

    // check AUTH by token
    let check_auth = (api_key, res) =>{
      if(!api_key) send_response(res, msg.no_api_key, 401);
      else if(!chek_token(api_key)) send_response(res, msg.wrong_api_key, 401);
      else return true
    };

    // TODO: chenge to regexp.test(str)
    // check hash from client request
    let check_Hash = (chash, hash, res) =>
      chash.length === 64
        ? true
        : send_response(res, msg.bad_hash(hash), 404);

    // check addr from client request
    let check_addr = caddr =>
      caddr.length === 40
            ? true
            : false

    // check listId from client request
    let check_listId = listId =>
      Object.values(cfg.list_type).includes(listId)
        ? true
        : false

    // check ModuleId from client request
    let check_moduleId = moduleId =>
      Object.values(cfg.modules).includes(moduleId)
        ? true
        : false

    // check entityId from client request
    let check_entityId = (entityId = 0) => {
      return entityId !== 0
        ? true
        : false
      };

    // check block from client request
    let check_block = block => {
      return (isInteger(block) && block > 0)
        ? true
        : false
    };

    // check address from client request
    let check_addr_exist = (address, res) => {
      return address.length === 40
        ? true
        : send_response(res, msg.wrong_addr, 404)
    };

    // hash operations
    // cut '0x' from hash string
    let cut_0x = hash =>
      (typeof hash === 'string')
        ? hash.split('0x').pop()
        : '';

    // remove unexpected chars from hex
    let clean_Hex = hash =>
      (typeof hash === 'string')
        ? hash.replace(/[^a-fA-F0-9]+/g, '')
        : '';

    // cut '0x' then remove unexpected chars from hex
    let cut0x_Clean = hash => clean_Hex(cut_0x(hash)).toLowerCase();

    // public interface
    return {
      isInt: n => isInteger(n),                                       // handy tools
      isFloat: n => isFloat(n),                                       // handy tools
      safePageAndSize: (p,s) => pageandsize(p,s),                     // build page options => harcoded limits constants from (Go safePageAndSize)
      apiToken: token => chek_token(token),                           // check API_KEY token (not used yet)
      auth: (api_key, res) => check_auth(api_key, res),               // auth using API_KEY token (not used yet)
      listId: lid => check_listId(lid),                               // check is correct ListId
      moduleId: mid => check_moduleId(mid),                           // check is correct ModuleId
      get_msg: () => msg,                                             // get client msgs object
      build_options: (req, lid, mid, eid) =>
        build_params(req, lid, mid, eid),                             // build query options
      build_io_opts: (params, listId, moduleId, entityId) =>
        build_params_io(params, listId, moduleId, entityId),
      cut0x: hash => cut_0x(hash),                                    // cut '0x' from hash string
      cut0xClean: hash => cut0x_Clean(hash),                          // cut '0x' then remove unexpected chars from hex
      checkHash: (chash, hash, res) => check_Hash(chash, hash, res),  // check hash from client request
      checkAddr: caddr => check_addr(caddr),                          // check address from client request
      entityId: eid => check_entityId(eid),                           // check entityId from client request
      block: block => check_block(block),                             // check block from client request
      addr: (address, res) => check_addr_exist(address, res)          // check IS address exists from client request
    }
  };
  return {
    getInstance: () => {
      if(!instance) instance = initSingleton();
      return instance
    }
  }
})();


module.exports.cheker = () => check_module_singleton.getInstance();
