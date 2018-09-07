const fs = require('fs'),
    cfg = require('../../config/config'),
    // JSONParse = require('json-parse-safe'),
    db = require('../../libs/db'),
    c = cfg.color,
    sso_service_url = cfg.sso.refreshJwtURL, // new token SSO endpoint
    sso_logout_url = cfg.sso.logoutJwtURL,
    _jwt = require('jsonwebtoken'),
    request = require('request'),
    pub_key = fs.readFileSync('config/sso_secret.pub', 'utf8');

const error = {
    401: { errorCode: 401, errorMessage: 'SSO Authentication error. Bad Temp Token' },
};

// set SSO payload
const get_jwt_payload = (token) =>
    Object({
        token: token,
        serviceId: 'simple',
    });

/** ask SSO for a new JWT pair */
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

/** Update or Insert user/client JWT using accountId */
const upsert = (accountId, jwt) =>
    new Promise((resolve, reject) => {
        db.get.then((db_instance) => {
            db_instance
                .collection('users')
                .update(
                    { accountId: accountId },
                    {
                        accountId: accountId,
                        accessToken: jwt.access_token,
                        refreshToken: jwt.refresh_token,
                    },
                    { upsert: true } // update or insert
                )
                .then(() => {
                    console.log(`Upsert accountId "${accountId}" OK`);
                    resolve();
                })
                .catch((e) => {
                    console.log(e);
                    reject();
                });
        });
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
                console.log(`${c.cyan}================================================================${c.white}`);
                let accountId = access_dec.authData.accountId;
                /** Update or Insert user/client JWT using accountId */
                upsert(accountId, jwt);
                resolve(jwt.access_token);
            })
            .catch((e) => {
                console.log(e);
                reject(e);
            });
    });

/** Logout user from SSO service
 * */
const ssoLogout = (access_tkn) =>
    new Promise((resolve, reject) => {
        request(
            {
                method: 'post',
                body: { token: access_tkn },
                json: true,
                url: sso_logout_url,
            },
            (err, res, body) => {
                if (err) reject(err);
                let statusCode = res.statusCode;
                if (statusCode === 401) reject(error['401']);
                console.log(`${c.green}============= Client loged out from SSO by access_token =============${c.yellow}`);
                console.log(body);
                console.log(`${c.green}=====================================================================${c.white}`);
                resolve(body);
            }
        );
    });

/** verify accessToken from client
 * if token expired -> refresh -> upsert
 * */
const verifyJWT = (access_tkn) =>
    new Promise((resolve, reject) => {
        _jwt.verify(access_tkn, pub_key, (err, decoded) => {
            if (err) {
                let access_dec = _jwt.decode(jwt.access_token); // decode client JWT access_token
                let accountId = access_dec.authData.accountId; // lookup accountId from decoded JWT access_token
                /** lookup refresh_token by accountId in MongoDb */
                db.get.then((db_instance) => {
                    db_instance
                        .collection('users')
                        .findOne({ accountId: accountId })
                        .then((db_token) => {
                            console.log(`find JWT pair by accountId "${accountId}"`);
                            console.log(`${c.red} Refreshing JWT pair${c.white}`);
                            let refreshToken = db_token.refreshToken;
                            /** ask SSO service for new JWT pair by refreshToken */
                            refreshJWT(refreshToken)
                                .then((new_token) => {
                                    /** Update or Insert user/client JWT using accountId */
                                    upsert(accountId, new_token);
                                    resolve(new_token);
                                })
                                .catch((e) => reject(e)); // reject with error from SSO
                        })
                        .catch((e) => {
                            console.log(`DB lookup JWT failed by accountId "${accountId}"`);
                            console.log(e);
                            reject(e);
                        });
                });
                reject(err); // reject with error from verify (never)
            }
            console.log(`${c.green}============= Client JWT access_token is verified =============${c.yellow}`);
            console.log(decoded);
            console.log(`${c.green}===============================================================${c.white}`);
            resolve(access_tkn);
        });
    });

/** get new JWT by refresh token */
const refreshJWT = (refreshToken) =>
    new Promise((resolve, reject) => {
        request(
            {
                method: 'post',
                body: get_jwt_payload(refreshToken),
                json: true,
                url: sso_service_url,
            },
            (err, res, new_token) => {
                if (err) reject(err);
                let statusCode = res.statusCode;
                if (statusCode === 401) reject(error['401']);
                resolve(new_token);
            }
        );
    });

module.exports = {
    verifyTempToken: verifyTemp, //   Verify  temp return JWT
    verifyAccessToken: verifyJWT, // Verify JWT from client return JWT
    refresh: refreshJWT, // refresh JWT pair
    ssoLogout: ssoLogout,
};
