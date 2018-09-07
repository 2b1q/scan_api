const fs = require('fs'),
    cfg = require('../../config/config'),
    JSONParse = require('json-parse-safe'),
    c = cfg.color,
    sso_service_url = cfg.sso.refreshJwtURL,
    _jwt = require('jsonwebtoken'),
    request = require('request'),
    pub_key = fs.readFileSync('config/sso_secret.pub', 'utf8');

const error = {
    401: { errorCode: 401, errorMessage: 'SSO Authentication error. Bad Temp Token' },
};

// set SSO payload
const get_jwt_payload = (tmp_tkn) =>
    Object({
        token: tmp_tkn,
        serviceId: 'simple',
    });

// ask SSO for a new JWT pair
const ssoGetJWT = (tmp_tkn) =>
    new Promise((resolve, reject) => {
        request(
            {
                method: 'post',
                body: get_jwt_payload(tmp_tkn),
                json: true,
                url: sso_service_url,
            },
            (err, res, body) => {
                if (err) reject(err);
                let statusCode = res.statusCode;
                if (statusCode === 401) reject(error['401']);
                resolve(body);
            }
        );
    });

/** Verify tempToken
 * send tempToken to SSO service and get JWT
 * */
const verifyTemp = (tmp_tkn) =>
    new Promise((resolve, reject) => {
        ssoGetJWT(tmp_tkn)
            .then((jwt) => {
                console.log(`${c.cyan}=============== GOT NEW JWT FROM SSO By tmpToken ===============${c.red}`);
                console.log(_jwt.decode(tmp_tkn));
                console.log(`${c.cyan}=============== NEW JWT accessToken ============================${c.green}`);
                let access_dec = _jwt.decode(jwt.access_token);
                console.log(access_dec);
                console.log(`${c.white}`);
                let uid = access_dec.authData.accountId;
                //todo save erfresh using uid

                resolve(jwt.access_token);
            })
            .catch((e) => {
                console.log(e);
                reject(e);
            });
    });

const newJWT = () =>
    new Promise((resolve, reject) => {
        resolve(token.access_token);
    });

const verifyJWT = (access_tkn) =>
    new Promise((resolve, reject) => {
        _jwt.verify(access_tkn, pub_key, (err, decoded) => {
            if (err) reject(err);
            console.log(`${c.green}============= Client JWT access_token is verified =============${c.yellow}
            ${decoded}${c.white}`);
            resolve(access_tkn);
        });
    });

const refreshJWT = () => new Promise((resolve, reject) => {});

module.exports = {
    verifyTempToken: verifyTemp, //   Verify  temp return JWT
    verifyAccessToken: verifyJWT, // Verify JWT from client return JWT
    refresh: refreshJWT, // refresh JWT pair
};
