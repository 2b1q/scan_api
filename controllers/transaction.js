/*
- transaction controller
*/
const tnx_model = require('../models/transaction'),
      logger = require('../utils/logger')(module),
      moment = require('moment'),
      check = require('../utils/checker').cheker();

let logit = (req, msg = '') => {
  let payload = {
    msg:              msg,
    query_params:     req.params,
    timestamp:        (() => moment().format('DD.MM.YYYY HH:mm:ss'))(),
    path:             module.filename.split('/').slice(-2).join('/')
  }
  return payload
}

const GetLastTnxs = async (req, res) => {
  // TODO parse req obj => add res.json if req incorrect
  // if(check.auth(req.query.api_key, res)) res.json({ lastTnx: await tnx_model.getLastTnxs()})
  if(check.lastId(req.query.lastId, res)) res.json({ lastTnx: await tnx_model.getLastTnxs()})

  // res.json({ lastTnx: await tnx_model.getLastTnxs()})
  logger.api_requests(logit(req))
}

const CountTnx = async (req, res) => res.json({ tonxCnt: await tnx_model.countTnx() })

module.exports = {
  lastTnxs: GetLastTnxs, // GET => get last transactions using options from client request
  countTnx: CountTnx
};
