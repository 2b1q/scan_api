const tnx_controller = require('../controllers/transaction'),
      block_controller = require('../controllers/block'),
      addr_controller = require('../controllers/address'),
      list_controller = require('../controllers/list'),
      eth_api = require('../ether/api'),
      eth_func = require('../ether/functions'),
      router = require('express').Router();

/* REST API endpoint
* - routing by path (new routing)
* - routing by moduleId parameter (current)
*/

/* tnxs endpoints */
router.post('/transactions/ether',    tnx_controller.lastTnxEth);     // GetLast ETH Transactions endpoint [HTTP POST]
router.post('/transactions/tokens',   tnx_controller.lastTnxTokens);  // GetLast Tokens Transactions endpoint [HTTP POST]
router.post('/transactions/details',  tnx_controller.TnxDetails);     // Get Transaction details endpoint [HTTP POST]
router.get('/transactions/count',     tnx_controller.countTnx);       // count all tnxs endpoint [HTTP GET]

router.get('/test/nodes',           eth_api.getLastBlocks);       // nodes last blocks
router.get('/test/lastblock',       eth_api.getLastBlock);       // nodes last blocks
router.get('/test/best',            eth_api.getBestProvider);       // nodes last blocks
router.get('/test/balance/eth',     eth_func.ethBalance);       // nodes last blocks
router.get('/test/balance/token',   eth_func.tokenBalance);       // nodes last blocks
router.get('/test/tx',              eth_func.getTransaction);       // nodes last blocks

/* block  endpoints */
router.post('/block/tokens',   block_controller.blockTokens);  // GetLast block tokens Transactions tendpoint [HTTP POST]
router.post('/block/ether',    block_controller.blockEth);     // GetLast ETH block ether Transactions endpoint [HTTP POST]
router.post('/block/details',  block_controller.blockDetails); // Block details [HTTP POST]

/* address  endpoints */
router.post('/address/tokens',   addr_controller.addrTokens);  // Get Address Tokens Transactions endpoint [HTTP POST]
router.post('/address/ether',    addr_controller.addrEth);     // Get Address ETH Transactions endpoint    [HTTP POST]
router.post('/address/details',  addr_controller.addrDetails); // Get Address details endpoint [HTTP POST]

/* current endpoints */
router.post('/txdetails',      tnx_controller.TnxDetails)      // Get Transaction details endpoint [HTTP POST]
router.post('/blockdetails',   block_controller.blockDetails)  // Block details [HTTP POST]
router.post('/addressdetails', addr_controller.addrDetails)    // Get Address details endpoint [HTTP POST]
router.post('/list',           list_controller.list)

module.exports = router;
