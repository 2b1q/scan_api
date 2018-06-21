/*
- transaction controller
*/
const tnx_model = require('../models/transaction'),
      logger = require('../utils/logger')(module),
      moment = require('moment'),
      check = require('../utils/checker').cheker();

let logit = (req, msg = '') => {
   return {
    msg:              msg,
    req_params:       req.params,
    req_query:        req.query,
    timestamp:        (() => moment().format('DD.MM.YYYY HH:mm:ss'))(),
    path:             module.filename.split('/').slice(-2).join('/')
  }
}

// GetLastTransactions(req.Params.Page,req.Params.Size,req.ListId)
const GetLastTnxs = async (req, res) => {
  // TODO check ModuleId: req.ModuleId
  logger.api_requests(logit(req)) // log query any way
  let ListId = req.query.ListId;
  // check ListId
  if(check.listId(ListId, res)){
    let options = check.safePageAndSize(req.query.page, req.query.size)
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
          ModuleId:       req.query.ModuleId || '',
          ListId:         ListId,
          UpdateTime:     moment()
        }
        res.json(response)
      } else {
        res.json({Error: "Not found", Head: {}, Rows: []})
      }



    } catch (e) {
      res.status(500)
      res.json({ error: e })
    }
  }
}

const CountTnx = async (req, res) =>
  logger.api_requests(logit(req))                                   // log query any way
  && check.lastId(req.query.lastId, res)                            // check listId
  && res.json({ tnx: await tnx_model.countTnx(req.query.lastId) })  // fwd data to model => count tnx by listId type

module.exports = {
  lastTnxs: GetLastTnxs, // GET => get last transactions using options from client request
  countTnx: CountTnx
};
