/*
- REST API transaction controller
*/
const tnx_model = require('../models/transaction'),
      logger = require('../utils/logger')(module),
      moment = require('moment'),
      check = require('../utils/checker').cheker();

let logit = (req, msg = '') => {
   return {
    msg:              msg,
    post_params:      req.body,
    get_params:       req.query,
    timestamp:        (() => moment().format('DD.MM.YYYY HH:mm:ss'))(),
    path:             module.filename.split('/').slice(-2).join('/')
  }
}

// GetLastTransactions(req.Params.Page,req.Params.Size,req.ListId)
const GetLastTnxs = async (req, res) => {
  // TODO check ModuleId: req.ModuleId
  logger.api_requests(logit(req)) // log query any way
  let ListId = req.body.ListId,
      ModuleId = req.body.ModuleId;
  let { page, size, filters } = req.body.params === undefined
    ? { page: 1, size: 20, filters: {} } // default values
    : req.body.params
  logger.info({
    ListId:ListId,
    ModuleId:ModuleId,
    page:page,
    size:size,
    filters:filters
  })
  // check ListId
  if(check.listId(ListId, res)){
    let options = check.safePageAndSize(page, size)
    options.ListId = ListId;
    // GetLastTransactions from tnx_model
    try {
      let response = await tnx_model.getLastTnxs(options);
      if(response.Rows.length > 0) {
        let { count, page, size } = response;
        delete response.size
        delete response.page
        delete response.count;
        response.Head = {
          TotalEntities:  count,
          PageNumber:     page,
          PageSize:       size,
          ModuleId:       ModuleId || 'transactions',
          ListId:         ListId,
          UpdateTime:     moment()
        }
        res.json(response)
      } else {
        res.json(check.get_msg().not_found)
      }
    // handle exception from DB tnx_model
    } catch (e) {
      res.status(500)
      res.json({ error: e }) // FWD exception to client
    }
  }
}

const CountTnx = async (req, res) =>
  logger.api_requests(logit(req))                                   // log query any way
  && check.listId(req.query.ListId, res)                            // check listId
  && res.json({ tnx: await tnx_model.countTnx(req.query.ListId) })  // fwd data to model => count tnx by listId type

module.exports = {
  lastTnxs: GetLastTnxs, // GET => get last transactions using options from client request
  countTnx: CountTnx     // count TNXS by req.query.ListId type
};
