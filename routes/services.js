const router = require('express').Router(),
    tnx_controller_v2 = require('../controllers/v2/transaction'),
    block_controller_v2 = require('../controllers/v2/block'),
    addr_controller_v2 = require('../controllers/v2/address'),
    common_v2 = require('../controllers/v2/common'),
    seacrh = require('../controllers/v2/search'),
    auth_controller = require('../controllers/restricted_area'),
    token_controller = require('../controllers/v2/token');

const v2_1_ptrn = (path) => `/v2_1/${path}`; // v. 2_1 pattern

/** REST API v.2.1 endpoints
 * - routing by path (new routing)
 */
/** tnxs v.2.1 endpoints */
router.get(v2_1_ptrn('transactions/ether'), tnx_controller_v2.eth); // GetLast ETH Transactions endpoint [HTTP GET]
router.get(v2_1_ptrn('transactions/tokens'), tnx_controller_v2.tokens); // GetLast Tokens Transactions endpoint [HTTP GET]
router.get(v2_1_ptrn('transactions/details'), tnx_controller_v2.details); // Get Transaction details endpoint [HTTP GET]

/** block v.2.1 endpoints */
router.get(v2_1_ptrn('block/tokens'), block_controller_v2.tokens); // GetLast block tokens Transactions tendpoint [HTTP GET]
router.get(v2_1_ptrn('block/ether'), block_controller_v2.eth); // GetLast ETH block ether Transactions endpoint [HTTP GET]
router.get(v2_1_ptrn('block/details'), block_controller_v2.details); // Block details [HTTP GET]

/** address v.2.1 endpoints */
router.get(v2_1_ptrn('address/tokens'), addr_controller_v2.tokens); // Get Address Tokens Transactions endpoint [HTTP GET]
router.get(v2_1_ptrn('address/ether'), addr_controller_v2.eth); // Get Address ETH Transactions endpoint    [HTTP GET]
router.get(v2_1_ptrn('address/details'), addr_controller_v2.details); // Get Address details endpoint [HTTP GET]
router.get(v2_1_ptrn('address/token-balance'), addr_controller_v2.tokenBalance); // Get Address toke balance endpoint [HTTP GET]

/** node info v.2.1 endpoint */
router.get(v2_1_ptrn('nodes'), common_v2.NodeStatus); // last block info ETH proxy

/** search v.2.1 endpoint */
router.get(v2_1_ptrn('search'), seacrh.tokenOrBlock); // search token/block controller

/** token v.2.1 info endpoints */
router.get(v2_1_ptrn('erc20/details'), token_controller.erc20details); // ERC20 token info
router.get(v2_1_ptrn('erc20/transactions'), token_controller.txs); // list token transactions
router.get(v2_1_ptrn('erc20/holders'), token_controller.holders); // ERC20 holders
router.get(v2_1_ptrn('erc20/price'), token_controller.market); // Token market history

/** SSO Auth/Logout v.2.1 endpoints */
router.get(v2_1_ptrn('auth'), auth_controller.auth);
router.get(v2_1_ptrn('logout'), auth_controller.logout);
router.get(v2_1_ptrn('restricted_'), auth_controller.restricted);

module.exports = router;
