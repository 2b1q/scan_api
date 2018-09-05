const jwt = require('jsonwebtoken'),
    request = require('request');

const newJWT = (tmp_tkn) =>
    new Promise((resolve, reject) => {
        let _jwt = 'superPuperJWTobject';
        resolve(_jwt);
    });

const verifyJWT = (access_tkn) =>
    new Promise((resolve, reject) => {
        if (access_tkn) resolve(true);
        reject('token not passed');
    });

const refreshJWT = () => new Promise((resolve, reject) => {});

module.exports = {
    new: newJWT, // Generate JWT by tempToken
    verify: verifyJWT, // Verify JWT from client
    refresh: refreshJWT, // refresh JWT pair
};
