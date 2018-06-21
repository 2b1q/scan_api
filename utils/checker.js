/* Checker singleton pattern with closures
*  - check AUTH (API_KEY)
*  - check isFloat, isInteger
*  - build page options
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
    // private functions
    let isFloat = n => n === +n && n !== (n|0),
        isInteger = n => n === +n && n === (n|0)
    // build page options (Go safePageAndSize "bkxscan/blob/master/main/api/main.go")
    let queryoptions = (p, s) => {
      let page = (isNaN(p)) ? 1 : Number (p).toFixed(); // default page = 1
      let size = (isNaN(s)) ? 20 : Number (s).toFixed(); // default size = 20 (if size 'undefined')
      // set page limits
      if(page < MIN_PAGE) page = MIN_PAGE;
      if(page > MAX_PAGE) page = MAX_PAGE;
      if(size < MIN_SIZE) size = MIN_SIZE;
      if(size > MAX_SIZE) size = MAX_SIZE;
      let skip = (page - 1) * size;
      if(skip > MAX_SKIP) page = MAX_SKIP / size;
      // return safePageAndSize
      return {
        skip: skip,
        size: size,
        page: page
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
      if(!api_key) send_response(res, { err: 'unable to set "api_key" param' }, 401)
      else if(!chek_token(api_key)) send_response(res, { err: 'bad "api_key"' }, 401)
      else return true
    }
    // check listId from client request
    let check_ListId = (listId, res) =>
      Object.values(cfg.list_type).includes(listId)
        ? true
        : send_response(res, {Error: 'Unknown ListId', Head: {}, Rows: []}, 404)

    // public interface
    return {
      isInt: n => isInteger(n),
      isFloat: n => isFloat(n),
      safePageAndSize: (p,s) => queryoptions(p,s),
      apiToken: token => chek_token(token),
      auth: (api_key, res) => check_auth(api_key, res),
      listId: (listId, res) => check_ListId(listId, res)
    }
  }
  return {
    getInstance: function(){
      if(!instance) instance = initSingleton();
      return instance
    }
  }
})()


module.exports.cheker = () => check_module_singleton.getInstance();
