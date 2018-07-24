const check = require('../../utils/checker').cheker(),
  cfg = require('../../config/config'),
  tnx_controller = require('./transaction'),
  block_controller = require('./block'),
  logger = require('../../utils/logger')(module),
  moment = require('moment'),
  addr_controller = require('./address'),
  block_types = Object.values(cfg.list_type).filter(vals => vals !== 'listOfTokenBalance'), // convert JSON to Array and exclude 'listOfTokenBalance'
  list_type = cfg.list_type;

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


// list API
exports.list = (req, res) => {
  logger.api_requests(logit(req)); // log query data any way
  let listId = req.body.listId || req.body.listid;      // TODO in API v.2 - remove lower case 'listid' parameter, use onle lowerCamelCase (listid)
  let moduleId = req.body.moduleId || req.body.moduleid;  // TODO in API v.2 - remove lower case 'moduleid' parameter, use onle lowerCamelCase (moduleId)
  let { entityId = 0 } = req.body.params || {}; // if entityId not set or no params => entityId = 0 => then "error"
  let options = {};
  // check listId AND moduleId
  if(check.listId(listId) && check.moduleId(moduleId)){
    switch(moduleId){
      case 'block':
        // check listId type for block query (fixed if listId = 'listOfTokenBalance' its REQ without RESP)
        if(!block_types.includes(listId)){
          res.status(400);
          res.json(check.get_msg().wrong_listId);
          break
        }
        // check block parameter is integer && > 0
        let block = Number(parseInt(entityId)); // convert to Number
        if(!check.block(block)){
          res.status(400);
          res.json(check.get_msg().wrong_block);
          break
        }
        // build options
        options = check.build_options(req, listId, moduleId, block);
        logger.info(options); // log options to console
        block_controller.getBlockTnx(options, res);
        break;
      case 'transactions': // listOfETH
        options = check.build_options(req, 'listOfETH', moduleId);
        logger.info(options); // log options to console
        tnx_controller.getTnx(options, res);
        break;
      case 'tokens': // listOfTokens
        options = check.build_options(req, 'listOfTokens', moduleId);
        logger.info(options); // log options to console
        tnx_controller.getTnx(options, res);
        break;
      case 'address':
        let c_addr = check.cut0xClean(entityId); // cut 0x and clean address
        // check cleared address by length
        if(!check.checkAddr(c_addr, entityId)){
          res.status(400)
          res.json(check.get_msg().bad_addr(entityId));
          break
        }
        options = check.build_options(req, listId, moduleId, c_addr);
        logger.info(options); // log options to console
        if(options.listId === list_type.token_balance){
          console.log("==>addrTokensBalance");
          addr_controller.addrTokensBalance(options, res);
        } else {
          console.log("==>getAddrTnx");
          addr_controller.getAddrTnx(options, res);
        }
        break;
      default: // not achievable
        res.status(400);
        res.json(check.get_msg().unknown_module_id)
    }
  } else {
    res.status(400);
    res.json({ error: `${check.get_msg().unknown_module_id.error} or ${check.get_msg().unknown_listid.error}` })
  }
};