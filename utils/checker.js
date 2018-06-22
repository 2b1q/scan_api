/* Checker singleton pattern with closures
*  - check API_KEY token (not used yet)
*  - handy tools => check isFloat, isInteger
*  - build page options => harcoded limits constants from (Go safePageAndSize)
*  - get client msgs object
*  - check is correct ListId
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
      not_found:      {Error: 'Not found', Head: {}, Rows: []},
      unknown_listid: {Error: 'Unknown ListId', Head: {}, Rows: []},
      no_api_key:     {Error: 'unable to set "api_key" param' },
      wrong_api_key:  {Error: 'bad "api_key"' }
    }
    // private functions
    let isFloat = n => n === +n && n !== (n|0),
        isInteger = n => n === +n && n === (n|0)
    // build page options (Go safePageAndSize "bkxscan/blob/master/main/api/main.go")
    let queryoptions = (p, s) => {
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
    }
    // check IF token exist
    let chek_token = token => cfg.restOptions.apiKeys.includes(token);
    // construct res object
    let send_response = function(res, msg, status) {
      res.status(status);
      res.json(msg)
    };
    // check AUTH by token
    let check_auth = (api_key, res) =>{
      if(!api_key) send_response(res, msg.no_api_key, 401)
      else if(!chek_token(api_key)) send_response(res, msg.wrong_api_key, 401)
      else return true
    }
    // check listId from client request
    let check_ListId = (listId, res) =>
      Object.values(cfg.list_type).includes(listId)
        ? true
        : send_response(res, msg.unknown_listid, 404)
    // public interface
    return {
      isInt: n => isInteger(n),                           // handy tools
      isFloat: n => isFloat(n),                           // handy tools
      safePageAndSize: (p,s) => queryoptions(p,s),        // build page options => harcoded limits constants from (Go safePageAndSize)
      apiToken: token => chek_token(token),               // check API_KEY token (not used yet)
      auth: (api_key, res) => check_auth(api_key, res),   // auth using API_KEY token (not used yet)
      listId: (listId, res) => check_ListId(listId, res), // check is correct ListId
      get_msg: () => msg                                  // get client msgs object
    }
  }
  return {
    getInstance: () => {
      if(!instance) instance = initSingleton();
      return instance
    }
  }
})()


module.exports.cheker = () => check_module_singleton.getInstance();
