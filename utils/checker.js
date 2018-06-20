/* Checker singleton pattern with closures
*  - check AUTH (API_KEY)
*  - check isFloat, isInteger
*  - build page options
*/
const check_module_singleton = (() => {
  let instance; // keep reference to instance
  // init instance
  let initSingleton = () => {
    // private functions
    let isFloat = n => n === +n && n !== (n|0),
        isInteger = n => n === +n && n === (n|0)
    // build page options
    let queryoptions = (p, s) => {
      let page = (isNaN(p)) ? 1 : Number (p).toFixed(); // default page = 1
      let size = (isNaN(s)) ? 20 : Number (s).toFixed(); // default size = 20 (if size 'undefined')
      page = (page >= 1) ? page : 1;
      size = (size >= 10) ? size : 10;
      let options = {
        limit: parseInt(size),
        skip: (page*size)-size,
        page: page
      }
      return options;
    }
    // check IF token exist
    let chek_token = token => require('../config/config').restOptions.apiKeys.includes(token);
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
    let check_ListId = (lastId, res) =>
      Object.values(require('../config/config').list_type).includes(lastId)
        ? true
        : send_response(res, {Error: 'Unknown ListId', Head: {}, Rows: []}, 404)

    // public interface
    return {
      isInt: n => isInteger(n),
      isFloat: n => isFloat(n),
      pageOptions: (p,s) => queryoptions(p,s),
      apiToken: token => chek_token(token),
      auth: (api_key, res) => check_auth(api_key, res),
      lastId: (lastId, res) => check_ListId(lastId, res)
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
