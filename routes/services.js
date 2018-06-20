const tnx_controller = require('../controllers/transaction'),
      router = require('express').Router();

/* tnxs endpoints */
router.get('/tnx/last',   tnx_controller.lastTnxs); // GetLastTransactions endpoint
router.get('/tnx/count',  tnx_controller.countTnx); // count all tnxs endpoint

/* block  endpoints */
/* address  endpoints */

module.exports = router;
