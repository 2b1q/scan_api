const tnx_controller = require('../controllers/transaction'),
      router = require('express').Router();

/* tnxs endpoints */
router.post('/transactions/tokens',   tnx_controller.lastTnxTokens); // GetLast Tokens Transactions endpoint
router.post('/transactions/ether',    tnx_controller.lastTnxEth);    // GetLast ETH Transactions endpoint
// TODO: router.post('/transactions/details',  tnx_controller.TnxDetails);    // Get Transaction details endpoint
router.get('/transactions/count',  tnx_controller.countTnx); // count all tnxs endpoint

/* block  endpoints */
/* address  endpoints */
/*
api/block/tokens
api/block/ether
api/block/details

api/transactions/tokens
api/transactions/ether
api/transactions/details

api/address/details детали к-ка
api/address/
*/

module.exports = router;
