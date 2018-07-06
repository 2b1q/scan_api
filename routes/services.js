const tnx_controller_v1 = require('../controllers/v1/transaction'),
      block_controller_v1 = require('../controllers/v1/block'),
      addr_controller_v1 = require('../controllers/v1/address'),
      list_controller_v1 = require('../controllers/v1/list'),
      eth_api = require('../ether/api'),
      eth_func = require('../ether/functions'),
      router = require('express').Router();

/* ETH test endpoinds */
router.get('/test/nodes',           eth_api.getLastBlocks);       // nodes last blocks
router.get('/test/lastblock',       eth_api.getLastBlock);       // nodes last blocks
router.get('/test/best',            eth_api.getBestProvider);       // nodes last blocks
router.get('/test/balance/eth',     eth_func.ethBalance);       // nodes last blocks
router.get('/test/balance/token',   eth_func.tokenBalance);       // nodes last blocks
router.get('/test/tx',              eth_func.getTransaction);       // nodes last blocks

/* REST API endpoint
* - routing by path (new routing)
* - routing by moduleId parameter (current)
*/
/* tnxs endpoints */
router.post('/transactions/ether',    tnx_controller_v1.lastTnxEth);     // GetLast ETH Transactions endpoint [HTTP POST]
router.post('/transactions/tokens',   tnx_controller_v1.lastTnxTokens);  // GetLast Tokens Transactions endpoint [HTTP POST]
router.post('/transactions/details',  tnx_controller_v1.TnxDetails);     // Get Transaction details endpoint [HTTP POST]
router.get('/transactions/count',     tnx_controller_v1.countTnx);       // count all tnxs endpoint [HTTP GET]


/* block  endpoints */
router.post('/block/tokens',   block_controller_v1.blockTokens);  // GetLast block tokens Transactions tendpoint [HTTP POST]
router.post('/block/ether',    block_controller_v1.blockEth);     // GetLast ETH block ether Transactions endpoint [HTTP POST]
router.post('/block/details',  block_controller_v1.blockDetails); // Block details [HTTP POST]

/* address  endpoints */
router.post('/address/tokens',   addr_controller_v1.addrTokens);  // Get Address Tokens Transactions endpoint [HTTP POST]
router.post('/address/ether',    addr_controller_v1.addrEth);     // Get Address ETH Transactions endpoint    [HTTP POST]
router.post('/address/details',  addr_controller_v1.addrDetails); // Get Address details endpoint [HTTP POST]

/* current endpoints */
/* API v1 routes -> can be /api/v1/route OR /api/route */
router.post(/(^\/v1\/txdetails$)|(^\/txdetails$)/,            tnx_controller_v1.TnxDetails)      // Get Transaction details endpoint [HTTP POST]
router.post(/(^\/v1\/blockdetails$)|(^\/blockdetails$)/,      block_controller_v1.blockDetails)  // Block details [HTTP POST]
router.post(/(^\/v1\/addressdetails$)|(^\/addressdetails$)/,  addr_controller_v1.addrDetails)    // Get Address details endpoint [HTTP POST]
router.post(/(^\/v1\/list$)|(^\/list$)/,                      list_controller_v1.list)

module.exports = router;
