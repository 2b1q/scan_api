const moment = require('moment'),
    cfg = require('../config/config'),
    logger = require('../utils/logger')(module),
    jwt = require('../models/sso/jwt');

// simple query logger
let logit = (req, msg = '') => {
    return {
        msg: msg,
        post_params: req.body,
        get_params: req.query,
        timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss'))(),
        path: module.filename
            .split('/')
            .slice(-2)
            .join('/'),
    };
};

const newJWT = async (req, res) => {
    logger.auth(logit(req)); // log auth requests
    let tmp_tkn = req.query.tkn;
    let redirectUrl = req.query.redirectUrl;
    if (tmp_tkn) {
        let _jwt = await jwt.verifyTempToken(tmp_tkn);
        res.cookie('jwt', _jwt, cfg.cookie);
    }
    if (redirectUrl) res.redirect(redirectUrl);
    else res.redirect('/');
};

module.exports = {
    setJWT: newJWT, // Generate JWT by tempToken
};
