const moment = require('moment'),
    cfg = require('../config/config'),
    project = cfg.project,
    api_version = cfg.api_version,
    logger = require('../utils/logger')(module),
    cluster = require('cluster'),
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
        api_version: api_version,
        module: 'SSO AUTH REST API controller',
        project: project,
        post_params: req.body,
        get_params: req.query,
        timestamp: (() => moment())(),
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
    return authorization;
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
    // check AUTH token
    try {
        // res.set('Authorization', 'Bearer ' + jwt_access_token).json(jwt_access_token);
        res.json(await jwt.verifyTempToken(token));
    } catch (e) {
        res.status(401).json(e);
    }
};

/** REST LOGOUT */
exports.logout = async (req, res) => {
    console.log(`${wid_ptrn('logout')}`);
    let token = getToken(req);
    if (token.hasOwnProperty('errorCode')) return res.status(401).json(token);
    // check AUTH token
    try {
        // res.set('Authorization', 'Bearer ' + jwt_access_token).json(jwt_access_token);
        res.json(await jwt.ssoLogout(token));
    } catch (e) {
        res.status(401).json(e);
    }
};

/** REST restricted TEST JWT */
exports.restricted = (req, res) => {
    let secret_payload = {
        msg: 'secret_payload ',
    };
    console.log(`${wid_ptrn('restricted test')}`);
    let token = getToken(req);
    if (token.hasOwnProperty('errorCode')) return res.status(401).json(token);
    // check access token
    jwt.verifyAccessToken(token)
        .then((jwt_access_token) => res.set('Authorization', 'Bearer ' + jwt_access_token).json(secret_payload))
        .catch((e) => res.status(401).json(e));
};
