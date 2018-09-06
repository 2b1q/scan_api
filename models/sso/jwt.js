const jwt = require('jsonwebtoken'),
    request = require('request'),
    secret = require('../../config/secret');

// fake JWT
const token = {
    access_token:
        'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdXRoRGF0YSI6eyJhY3RpdmUiOmZhbHNlLCJyb2xlcyI6WyJDVV91c2VyIl0sImFjY291bnRJZCI6IjViOGQzNmIxZDRhZGMyMDAwMTM2YTgyMSJ9LCJzZXJ2aWNlSWQiOiJnZW5lcmFsIiwidG9rZW5UeXBlIjoiYWNjZXNzX3Rva2VuIiwiZXhwIjoxNTM2NTAwNTczLCJpc3MiOiJiYW5rZXgtdG9rZW5pemF0aW9uLXByb2ZpbGUtc3NvLXNlcnZlciJ9.ipsJgmp6Ka4wWD8y5QF_F1Caz1U0IQfSZskUgXw7aQl_ovk-6BXcaIpa2Nin7TJgWR-b3SNO9Gx-ZFvA-etNQnOoR_5ZQRbIhAtLDYrTbLtzVWkEsoDdnGu5YDqU9YqKNLch26cdqYRBfiIUDpT8NtDt_PqKdWbkHdiywyfg5Pk',
};

const get_jwt_payload = {
    token: (tmp_tkn) => tmp_tkn,
    serviceId: 'BANKEX Scan',
};

const verifyTemp = (tmp_tkn) =>
    new Promise((resolve, reject) => {
        if (tmp_tkn) resolve(token.access_token);
        reject('bad temp');
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
