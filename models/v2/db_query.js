/*
 * Single DB query model v.2
 * get collection query selector, params
 * return DB data
 */
const db = require('../../libs/db'),
    cfg = require('../../config/config');

// get collection by name
const col = (name) => new Promise((resolve) => db.get.then((db_con) => resolve(db_con.collection(name))));

// get tnx db collection name by listId
const get_tnx_col_by = (listId) => {
    switch (listId) {
        case cfg.list_type.eth:
            return cfg.store.cols.eth;
        case cfg.list_type.token:
            return cfg.store.cols.token;
        default:
            return '';
    }
};

// find tokens
const findTokens = async (tnx_col, query) => {
    let db_col = await col(tnx_col);
    return new Promise((resolve, reject) =>
        db_col.find(query).toArray((err, docs) => {
            if (err) return reject(err); // stop flow and return reject with exeption
            resolve(docs);
        })
    );
};

// count collection docs by selector
const collectionCount = async (collection, selector = {}) => {
    if (Array.isArray(collection)) {
        let promise_all_result = collection.map(async (col_type) => {
            let db_col = await col(col_type);
            return {
                [col_type]: await db_col.count(selector),
            };
        });
        // wait all db request and construct one result object
        return await Promise.all(promise_all_result).then((data) => Object.assign(...data));
    } else {
        let db_col = await col(collection);
        return {
            type: collection,
            cnt: await db_col.count(selector),
        };
    }
};

// find one db doc from collection using query pattern
const findOneQuery = async (collection, query = {}) => {
    let db_col = await col(collection);
    return new Promise(async (resolve) => {
        let count = await db_col.count(query);
        if (count === 0) resolve({ rows: count });
        // fix (reject to resolve)
        else db_col.findOne(query).then((doc) => resolve(doc));
    });
};

// find db doc from collection using query pattern
const findQuery = async (collection, query = {}) => {
    let db_col = await col(collection);
    return new Promise(async (resolve) => {
        let count = await db_col.count(query);
        if (count === 0) resolve({ rows: count });
        else
            db_col.find(query).toArray((err, docs) => {
                if (err) {
                    console.log(`mongo err: ${err}`);
                    resolve({ rows: 0 });
                } else resolve(docs);
            });
    });
};

// Mongo distinct key, query, collection
const distinct = async (collection, query = {}, key) => {
    let db_col = await col(collection);
    return new Promise(function(resolve) {
        db_col.distinct(key, query, (err, docs) => {
            if (err) {
                console.log(`mongo err: ${err}`);
                resolve({ rows: 0 });
            } else resolve(docs);
        });
    });
};

// Only clear DB API without business logic
module.exports = {
    // getDbTransactions: GetDbTransactions, // common tnx get function (for block and tnx API)
    colCount: collectionCount, // count TNXS by ListId type
    // TxDetails: TxDetails,
    // blockDetails: GetBlock,          // get block details by options
    findOne: findOneQuery, // find one db doc from collection using query pattern
    find: findQuery, // find db docs from collection using query pattern
    distinct: distinct, // mongo distinct query
    getcol: col,
};
