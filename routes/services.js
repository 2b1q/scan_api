const tnx_controller = require('../controllers/transaction'),
      router = require('express').Router();


router.get('/tnx/last',   tnx_controller.lastTnxs);
router.get('/tnx/count',  tnx_controller.countTnx);


module.exports = router;
