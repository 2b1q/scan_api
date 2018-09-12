const MongoClient = require('mongodb').MongoClient,
    config = require('../config/config');

let db = null, // reference to db
    url = config.store.mongo.uri,
    dbname = config.store.mongo.dbname,
    options = config.store.mongo.options,
    c = config.color;

/** get DB instance Promise */
exports.get = () =>
    new Promise((resolve, reject) => {
        if (db) {
            db.stats()
                .then(() => resolve(db)) // Try get stats from "DB instance" then resolve "DB instance object" reference
                .catch((e) => {
                    db = null; // clear bad reference to "DB instance object"
                    reject(e);
                });
        } else {
            MongoClient.connect(
                url,
                options
            )
                .then((client) => {
                    db = client.db(dbname);
                    console.log(`${c.green}[i] connected to MongoDB ${c.white}${url + dbname}}`);
                    resolve(db);
                })
                .catch((e) => {
                    db = null; // clear bad reference to "DB instance object"
                    console.error(`${c.red}Failed connect to DB:\n${c.yellow}${e}${c.white}`);
                    reject(e);
                });
        }
    });
