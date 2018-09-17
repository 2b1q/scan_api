const router = require('express').Router(),
    tnx_controller_v1 = require('../controllers/v1/transaction'),
    block_controller_v1 = require('../controllers/v1/block'),
    addr_controller_v1 = require('../controllers/v1/address'),
    list_controller_v1 = require('../controllers/v1/list'),
    tnx_controller_v2 = require('../controllers/v2/transaction'),
    block_controller_v2 = require('../controllers/v2/block'),
    addr_controller_v2 = require('../controllers/v2/address'),
    common_v2 = require('../controllers/v2/common'),
    seacrh = require('../controllers/v2/search'),
    auth_controller = require('../controllers/restricted_area'),
    token_controller = require('../controllers/v2/token');

const v1_ptrn = (path) => new RegExp(`(^\/v1\/${path}$)|(^\/${path}$)`); // v1 route RegExp pattern
const v2_ptrn = (path) => new RegExp(`(^\/v2\/${path}$)`); // v2 route RegExp pattern

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

/** node info */
router.get(v2_ptrn('nodes'), common_v2.NodeStatus); // last block info ETH proxy

/** search endpointds*/
router.get(v2_ptrn('search'), seacrh.tokenOrBlock); // search token/block controller

/** token info endpoints */
router.get(v2_ptrn('erc20/details'), token_controller.erc20details); // ERC20 token info
router.get(v2_ptrn('erc20/transactions'), token_controller.txs); // list token transactions
router.get(v2_ptrn('erc20/holders'), token_controller.holders); // ERC20 holders
router.get(v2_ptrn('erc20/price'), token_controller.market); // Token market history

/** SSO Auth endpoint */
router.get(v2_ptrn('auth'), auth_controller.auth);

/** REST API v.1 endpoints
 * - routing by moduleId parameter (current)
 */

/** API v1 routes -> can be /api/v1/route OR /api/route */
router.post(v1_ptrn('txdetails'), tnx_controller_v1.TnxDetails); // Get Transaction details endpoint [HTTP POST]
router.post(v1_ptrn('blockdetails'), block_controller_v1.blockDetails); // Block details [HTTP POST]
router.post(v1_ptrn('addressdetails'), addr_controller_v1.addrDetails); // Get Address details endpoint [HTTP POST]
router.post(v1_ptrn('list'), list_controller_v1.list);

module.exports = router;
