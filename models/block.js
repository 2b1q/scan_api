/*
* Block model.
* inherited from GO API:
    api.GetBlockTransactions(1000014, 2, 10, "txtype = 'tx'")
    api.GetBlock(1000014)
    api.GetBlock(10000)
    api.GetBlock(0)
*/
const db        = require('../libs/db'),
      MAX_SKIP  = require('../config/config').store.mongo.max_skip,
      cfg       = require('../config/config');

// get collection by name
let col = name => new Promise((resolve, reject) =>
  db.get.then(db_con => resolve(db_con.collection(name)))
);

// get tnx db collection name by listId
let get_tnx_col_by = listId => listId ==='listOfETH' ? 'ether_txn':'token_txn';


/* get GetblockTransactions
* Go e.g. api.GetBlockTransactions(1000014, 2, 10, "txtype = 'tx'")
*/
let GetblockTransactions = async (options = {}) => {
  console.log(options);
  let { skip, page, size, listId, entityId } = options;
  let tnx_col = get_tnx_col_by(listId)
  let db_col = await col(tnx_col)
  let selector = { block: entityId }
  let count = await db_col.find(selector).count({})
  if(count === 0) return { rows: '' } // stop flow if 0 docs
  if(count > MAX_SKIP) count = MAX_SKIP
  return new Promise((resolve,reject) =>
    db_col.find(selector,{allowDiskUse: true}) // allowDiskUse lets the server know if it can use disk to store temporary results for the aggregation (requires mongodb 2.6 >)
      .sort({ 'hash': 1 })
      .skip(skip)
      .limit(size)
      .toArray((err, docs) => {
        if(err) return reject(err) // stop flow and return reject with exeption
        let txns = docs.map(tx => {
          return {
            // construct token object
            token: {
              addr:   tx.tokenaddr,
              name:   tx.tokenname,
              smbl:   tx.tokensmbl,
              dcm:    tx.tokendcm,
              type:   tx.tokentype
            },
            ...tx // return all data AS IS
          }
        })
        resolve({
          page:page,
          size:size,
          count:count,
          skip:skip,
          rows:txns
        })
      })
  );
}



module.exports = {
  blockTnxs: GetblockTransactions
}





/*
api.GetBlockTransactions(1000014, 2, 10, "txtype = 'tx'")
api.GetBlock(1000014)
api.GetBlock(10000)
api.GetBlock(0)
*/
