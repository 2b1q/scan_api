const check = require('../../utils/checker').cheker(),
      cfg = require('../../config/config'),
      tnx_controller = require('./transaction'),
      block_controller = require('./block'),
      logger = require('../../utils/logger')(module),
      moment = require('moment'),
      addr_controller = require('./address');

// simple query logger
let logit = (req, msg = '') => {
  return {
    msg:              msg,
    post_params:      req.body,
    get_params:       req.query,
    timestamp:        (() => moment().format('DD.MM.YYYY HH:mm:ss'))(),
    path:             module.filename.split('/').slice(-2).join('/')
  }
};

// check block/address options (REST API).
const checkOptions = (req, res, listId, moduleId, entityId) =>
  check.entityId(entityId, res)
    ? check.build_options(req, listId, moduleId, entityId)
    : false;

// list API
exports.list = (req, res) => {
  logger.api_requests(logit(req)); // log query data any way
  let listId   = req.body.listId || req.body.listid;      // TODO in API v.2 - remove lower case 'listid' parameter, use onle lowerCamelCase (listid)
  let moduleId = req.body.moduleId || req.body.moduleid;  // TODO in API v.2 - remove lower case 'moduleid' parameter, use onle lowerCamelCase (moduleId)
  let { entityId = 0 } = req.body.params || {}; // if entityId not set or no params => entityId = 0 => then "error"
  let options = {};
  // check listId AND moduleId
  if(check.listId(listId, res) && check.moduleId(moduleId, res)) {
    switch (moduleId) {
      case 'block':
        entityId = Number( parseInt(entityId) ); // parse any value and convert to Number
        options = checkOptions(req, res, listId, moduleId, entityId);
        if(options) block_controller.getBlockTnx(options, res);
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
          let c_addr = check.cut0xClean(entityId) // cut 0x and clean address
          // check cleared address by length
          if( !check.checkAddr(c_addr, entityId) ) {
              res.json(check.get_msg().bad_addr(entityId))
              break
          }
          options = checkOptions(req, res, listId, moduleId, c_addr)
        if(options) {
          if (options.listId === cfg.list_type.token_balance){
            console.log("==>addrTokensBalance");
            addr_controller.addrTokensBalance(options, res);
          } else {
            console.log("==>getAddrTnx");
            addr_controller.getAddrTnx(options, res);
          }
        }
        break;
      default: res.json(check.get_msg().unknown_module_id)
    }
  }
};
/*
{
    "listId": "listOfETH",          // тип списка - эфир или токены (в будущем моет быть что-то еще)
    "moduleId": "block",            // назначение модуля
    "params": {
        "entityId": "5000000",      // идентификатор поиска. Адрес или номер блока
        "page": 1,                  // номер страницы
        "size": 50,                 // кол-во элементов на странице
    }
}
api/list "moduleId":
  block, (принимает оба значения listId)
  transactions (принимает только listId = listOfETH),
  tokens,  (принимает только listId = listOfTokens)
  address (принимает оба значения listId)
*/
