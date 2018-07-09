const tnx_controller_v1 = require('../controllers/v1/transaction'),
      block_controller_v1 = require('../controllers/v1/block'),
      addr_controller_v1 = require('../controllers/v1/address'),
      list_controller_v1 = require('../controllers/v1/list'),
      eth_api = require('../ether/api'),
      router = require('express').Router();

// v1 route RegExp pattern
const v1_ptrn = path => new RegExp(`(^\/v1\/${path}$)|(^\/${path}$)`)

/* ETH test endpoinds */
router.get('/nodes',           eth_api.getLastBlocks);       // nodes last blocks

/* REST API endpoint
* - routing by path (new routing)
* - routing by moduleId parameter (current)
*/
/* tnxs endpoints */
router.post(v1_ptrn('transactions/ether'),    tnx_controller_v1.lastTnxEth);     // GetLast ETH Transactions endpoint [HTTP POST]
router.post(v1_ptrn('transactions/tokens'),   tnx_controller_v1.lastTnxTokens);  // GetLast Tokens Transactions endpoint [HTTP POST]
router.post(v1_ptrn('transactions/details'),  tnx_controller_v1.TnxDetails);     // Get Transaction details endpoint [HTTP POST]
router.get(v1_ptrn('transactions/count'),     tnx_controller_v1.countTnx);       // count all tnxs endpoint [HTTP GET]


/* block  endpoints */
router.post(v1_ptrn('block/tokens'),   block_controller_v1.blockTokens);  // GetLast block tokens Transactions tendpoint [HTTP POST]
router.post(v1_ptrn('block/ether'),    block_controller_v1.blockEth);     // GetLast ETH block ether Transactions endpoint [HTTP POST]
router.post(v1_ptrn('block/details'),  block_controller_v1.blockDetails); // Block details [HTTP POST]

/* address  endpoints */
router.post(v1_ptrn('address/tokens'),   addr_controller_v1.addrTokens);  // Get Address Tokens Transactions endpoint [HTTP POST]
router.post(v1_ptrn('address/ether'),    addr_controller_v1.addrEth);     // Get Address ETH Transactions endpoint    [HTTP POST]
router.post(v1_ptrn('address/details'),  addr_controller_v1.addrDetails); // Get Address details endpoint [HTTP POST]

/* current endpoints */
/* API v1 routes -> can be /api/v1/route OR /api/route */
router.post(v1_ptrn('txdetails'),       tnx_controller_v1.TnxDetails)      // Get Transaction details endpoint [HTTP POST]
router.post(v1_ptrn('blockdetails'),    block_controller_v1.blockDetails)  // Block details [HTTP POST]
router.post(v1_ptrn('addressdetails'),  addr_controller_v1.addrDetails)    // Get Address details endpoint [HTTP POST]
router.post(v1_ptrn('list'),            list_controller_v1.list)

module.exports = router;
