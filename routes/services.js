const tnx_controller_v1 = require('../controllers/v1/transaction'),
  block_controller_v1 = require('../controllers/v1/block'),
  addr_controller_v1 = require('../controllers/v1/address'),
  list_controller_v1 = require('../controllers/v1/list'),
  tnx_controller_v2 = require('../controllers/v2/transaction'),
  block_controller_v2 = require('../controllers/v2/block'),
  addr_controller_v2 = require('../controllers/v2/address'),
  eth_api = require('../ether/api'),
  router = require('express').Router();

// v1 route RegExp pattern
const v1_ptrn = path => new RegExp(`(^\/v1\/${path}$)|(^\/${path}$)`);
// v2 route RegExp pattern
const v2_ptrn = path => new RegExp(`(^\/v2\/${path}$)`);

/* ETH test endpoinds */
router.get('/nodes', eth_api.getLastBlocks);       // nodes last blocks

/* REST API v.2 endpoints
 * - routing by path (new routing)
 */
/* tnxs v.2 endpoints */
// router.post(v2_ptrn('transactions/ether'), tnx_controller_v2.eth);        // GetLast ETH Transactions endpoint [HTTP POST]
// router.post(v2_ptrn('transactions/tokens'), tnx_controller_v2.tokens);    // GetLast Tokens Transactions endpoint [HTTP POST]
// router.post(v2_ptrn('transactions/details'), tnx_controller_v2.details);  // Get Transaction details endpoint [HTTP POST]
// router.get(v2_ptrn('transactions/count'), tnx_controller_v2.count);       // count all tnxs endpoint [HTTP GET]

/* block v.2 endpoints */
// router.post(v2_ptrn('block/tokens'), block_controller_v2.tokens);   // GetLast block tokens Transactions tendpoint [HTTP POST]
// router.post(v2_ptrn('block/ether'), block_controller_v2.eth);       // GetLast ETH block ether Transactions endpoint [HTTP POST]
// router.post(v2_ptrn('block/details'), block_controller_v2.details); // Block details [HTTP POST]

/* address v.2 endpoints */
// router.post(v2_ptrn('address/tokens'), addr_controller_v2.tokens);    // Get Address Tokens Transactions endpoint [HTTP POST]
// router.post(v2_ptrn('address/ether'), addr_controller_v2.eth);        // Get Address ETH Transactions endpoint    [HTTP POST]
// router.post(v2_ptrn('address/details'), addr_controller_v2.details);  // Get Address details endpoint [HTTP POST]

/* REST API v.1 endpoints
 * - routing by moduleId parameter (current)
 */

/* API v1 routes -> can be /api/v1/route OR /api/route */
router.post(v1_ptrn('txdetails'), tnx_controller_v1.TnxDetails);        // Get Transaction details endpoint [HTTP POST]
router.post(v1_ptrn('blockdetails'), block_controller_v1.blockDetails); // Block details [HTTP POST]
router.post(v1_ptrn('addressdetails'), addr_controller_v1.addrDetails); // Get Address details endpoint [HTTP POST]
router.post(v1_ptrn('list'), list_controller_v1.list);

module.exports = router;
