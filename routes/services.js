const tnx_controller = require('../controllers/transaction'),
      block_controller = require('../controllers/block'),
      addr_controller = require('../controllers/address'),
      router = require('express').Router();

/* tnxs endpoints */
router.post('/transactions/ether',    tnx_controller.lastTnxEth);     // GetLast ETH Transactions endpoint
router.post('/transactions/tokens',   tnx_controller.lastTnxTokens);  // GetLast Tokens Transactions endpoint
router.post('/transactions/details',  tnx_controller.TnxDetails);     // Get Transaction details endpoint
router.get('/transactions/count',     tnx_controller.countTnx);       // count all tnxs endpoint

/* block  endpoints */
router.post('/block/tokens',   block_controller.blockTokens);  // GetLast block tokens Transactions tendpoint
router.post('/block/ether',    block_controller.blockEth);     // GetLast ETH block ether Transactions endpoint
router.post('/block/details',  block_controller.blockDetails); // Block details

/* address  endpoints */
router.post('/address/tokens',   addr_controller.addrTokens);  // Get Address Tokens Transactions endpoint [HTTP POST]
router.post('/address/ether',    addr_controller.addrEth);     // Get Address ETH Transactions endpoint    [HTTP POST]
router.post('/address/details',  addr_controller.addrDetails); // Get Address details endpoint     [HTTP POST]

module.exports = router;
