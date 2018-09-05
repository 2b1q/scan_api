const tnx_controller_v1 = require('../controllers/v1/transaction'),
    block_controller_v1 = require('../controllers/v1/block'),
    addr_controller_v1 = require('../controllers/v1/address'),
    list_controller_v1 = require('../controllers/v1/list'),
    tnx_controller_v2 = require('../controllers/v2/transaction'),
    block_controller_v2 = require('../controllers/v2/block'),
    addr_controller_v2 = require('../controllers/v2/address'),
    common_v2 = require('../controllers/v2/common'),
    router = require('express').Router(),
    auth_controller = require('../controllers/restricted_area');

const v1_ptrn = (path) => new RegExp(`(^\/v1\/${path}$)|(^\/${path}$)`); // v1 route RegExp pattern
const v2_ptrn = (path) => new RegExp(`(^\/v2\/${path}$)`); // v2 route RegExp pattern

/* ETH test endpoinds */
// router.get('/nodes', eth_api.getLastBlocks); // nodes last blocks

/** REST API v.2 endpoints
 * - routing by path (new routing)
 */
/** tnxs v.2 endpoints */
router.get(v2_ptrn('transactions/ether'), tnx_controller_v2.eth); // GetLast ETH Transactions endpoint [HTTP GET]
router.get(v2_ptrn('transactions/tokens'), tnx_controller_v2.tokens); // GetLast Tokens Transactions endpoint [HTTP GET]
router.get(v2_ptrn('transactions/details'), tnx_controller_v2.details); // Get Transaction details endpoint [HTTP GET]

/** block v.2 endpoints */
router.get(v2_ptrn('block/tokens'), block_controller_v2.tokens); // GetLast block tokens Transactions tendpoint [HTTP GET]
router.get(v2_ptrn('block/ether'), block_controller_v2.eth); // GetLast ETH block ether Transactions endpoint [HTTP GET]
router.get(v2_ptrn('block/details'), block_controller_v2.details); // Block details [HTTP GET]

/** address v.2 endpoints */
router.get(v2_ptrn('address/tokens'), addr_controller_v2.tokens); // Get Address Tokens Transactions endpoint [HTTP GET]
router.get(v2_ptrn('address/ether'), addr_controller_v2.eth); // Get Address ETH Transactions endpoint    [HTTP GET]
router.get(v2_ptrn('address/details'), addr_controller_v2.details); // Get Address details endpoint [HTTP GET]
router.get(v2_ptrn('address/token-balance'), addr_controller_v2.tokenBalance); // Get Address toke balance endpoint [HTTP GET]
router.get(v2_ptrn('nodes'), common_v2.NodeStatus); // Get Address toke balance endpoint [HTTP GET]

/** SSO Auth endpoint */
router.get('/auth', auth_controller.setJWT);

/** REST API v.1 endpoints
 * - routing by moduleId parameter (current)
 */

/** API v1 routes -> can be /api/v1/route OR /api/route */
router.post(v1_ptrn('txdetails'), tnx_controller_v1.TnxDetails); // Get Transaction details endpoint [HTTP POST]
router.post(v1_ptrn('blockdetails'), block_controller_v1.blockDetails); // Block details [HTTP POST]
router.post(v1_ptrn('addressdetails'), addr_controller_v1.addrDetails); // Get Address details endpoint [HTTP POST]
router.post(v1_ptrn('list'), list_controller_v1.list);

module.exports = router;
