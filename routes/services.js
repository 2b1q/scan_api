const tnx_controller = require('../controllers/transaction'),
      router = require('express').Router();

/* tnxs endpoints */
router.post('/transactions/ether',    tnx_controller.lastTnxEth);     // GetLast ETH Transactions endpoint
router.post('/transactions/tokens',   tnx_controller.lastTnxTokens);  // GetLast Tokens Transactions endpoint
router.post('/transactions/details',  tnx_controller.TnxDetails);     // Get Transaction details endpoint
router.get('/transactions/count',     tnx_controller.countTnx);       // count all tnxs endpoint

/* block  endpoints */
// TODO: router.post('/block/tokens',   block_controller.blockTokens);  // GetLast block tokens Transactions tendpoint
// TODO: router.post('/block/ether',    block_controller.blockEth);     // GetLast ETH block ether Transactions endpoint
// TODO: router.post('/block/details',  block_controller.blockDetails); // Block details

/* address  endpoints */
/*
api/block/tokens
api/block/ether
api/block/details

api/transactions/details

api/address/details детали к-ка
api/address/
*/

module.exports = router;
