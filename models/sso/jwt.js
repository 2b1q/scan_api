const cfg = require('../../config/config'),
    JSONParse = require('json-parse-safe'),
    c = cfg.color,
    sso_service_url = cfg.sso.refreshJwtURL,
    jwt = require('jsonwebtoken'),
    request = require('request'),
    secret = require('../../config/secret');

// fake JWT
const token = {
    access_token:
        'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdXRoRGF0YSI6eyJhY3RpdmUiOmZhbHNlLCJyb2xlcyI6WyJDVV91c2VyIl0sImFjY291bnRJZCI6IjViOGQzNmIxZDRhZGMyMDAwMTM2YTgyMSJ9LCJzZXJ2aWNlSWQiOiJnZW5lcmFsIiwidG9rZW5UeXBlIjoiYWNjZXNzX3Rva2VuIiwiZXhwIjoxNTM2NTAwNTczLCJpc3MiOiJiYW5rZXgtdG9rZW5pemF0aW9uLXByb2ZpbGUtc3NvLXNlcnZlciJ9.ipsJgmp6Ka4wWD8y5QF_F1Caz1U0IQfSZskUgXw7aQl_ovk-6BXcaIpa2Nin7TJgWR-b3SNO9Gx-ZFvA-etNQnOoR_5ZQRbIhAtLDYrTbLtzVWkEsoDdnGu5YDqU9YqKNLch26cdqYRBfiIUDpT8NtDt_PqKdWbkHdiywyfg5Pk',
};

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

const verifyTemp = (tmp_tkn) =>
    new Promise((resolve, reject) => {
        ssoGetJWT(tmp_tkn)
            .then((jwt) => {
                console.log('=============== GOT NEW JWT ===============');
                console.log(`${c.cyan}${jwt}${c.white}`);
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
        if (access_tkn) resolve(token.access_token);
        reject('token not passed');
    });

const refreshJWT = () => new Promise((resolve, reject) => {});

module.exports = {
    verifyTempToken: verifyTemp, //   Verify  temp return JWT
    verifyAccessToken: verifyJWT, // Verify JWT from client return JWT
    refresh: refreshJWT, // refresh JWT pair
};
