const moment = require('moment'),
    cfg = require('../config/config'),
    logger = require('../utils/logger')(module),
    cluster = require('cluster'),
    _jwt = require('jsonwebtoken'),
    jwt = require('../models/sso/jwt'),
    c = cfg.color,
    check = require('../utils/checker').cheker();

// cluster.worker.id
const wid = cluster.worker.id;

// worker id pattern
const wid_ptrn = (endpoint) =>
    `${c.green}worker[${wid}]${c.red}[JWT]${c.cyan}[REST API AUTH controller]${c.red} > ${c.green}[${endpoint}] ${c.white}`;

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

/** Check Address */
const getToken = (req) => {
    logger.auth(logit(req)); // log query data any way
    let { authorization } = req.headers; // Authorization
    if (!authorization) return check.get_msg().no_jwt; // invalid token
    // get the decoded payload and header
    let token = _jwt.decode(authorization);
    let response = { token: authorization };
    // check JWT access_token
    if (token.tokenType === 'access_token') {
        response.type = 'access_token';
        return response;
    } else if (token.tokenType === 'auth_code') {
        response.type = 'auth_code';
        return response;
    }
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

/** REST AUTH */
exports.auth = async (req, res) => {
    console.log(`${wid_ptrn('auth')}`);
    let token = getToken(req);
    if (token.hasOwnProperty('errorCode')) return res.status(401).json(token);
    // check JWT access_token
    if (token.type === 'access_token') {
        try {
            let jwt_access_token = await jwt.verifyAccessToken(token.token);
            res.set('Authorization', 'Bearer ' + jwt_access_token).json();
        } catch (e) {
            res.status(401).json(e);
        }
    } else {
        // check AUTH token
        try {
            let jwt_access_token = await jwt.verifyTempToken(token.token);
            res.set('Authorization', 'Bearer ' + jwt_access_token).json();
        } catch (e) {
            res.status(401).json(e);
        }
    }
};
