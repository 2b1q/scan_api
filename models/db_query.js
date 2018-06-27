/*
* Single DB query model
* get collection query selector, params
* return DB data
*/
const db        = require('../libs/db'),
      cfg       = require('../config/config');

// get collection by name
const col = name => new Promise((resolve, reject) =>
  db.get.then(db_con => resolve(db_con.collection(name)))
);

// get tnx db collection name by listId
const get_tnx_col_by = listId => listId ==='listOfETH' ? 'ether_txn':'token_txn';

// find tokens
const findTokens = async (tnx_col, query) => {
  let db_col = await col(tnx_col)
  return new Promise((resolve, reject) =>
    db_col.find(query)
      .toArray((err, docs) => {
        if(err) return reject(err) // stop flow and return reject with exeption
        resolve(docs)
      })
  );
}

// common tnx get function (for block and tnx API)
const GetDbTransactions = async options => {
  console.log(options);
  let { skip, page, size, listId, entityId, max_skip, selector, sort } = options;
  let tnx_col = get_tnx_col_by(listId)
  let db_col = await col(tnx_col)
  let count = await db_col.find(selector).count({})
  if(count === 0) return { rows: '' } // stop flow if 0 docs
  if(count > max_skip) count = max_skip
  return new Promise((resolve,reject) =>
    db_col.find(selector,{allowDiskUse: true}) // allowDiskUse lets the server know if it can use disk to store temporary results for the aggregation (requires mongodb 2.6 >)
      .sort(sort)
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
            ...tx // spread => return all data AS IS
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

// count all tnxs by listId type
const countTnx = async listId => {
  let tnx_col = get_tnx_col_by(listId)
  let db_col = await col(tnx_col)
  return {
    type: tnx_col,
    cnt: await dbquery.countTnx(listId)
  }
}

// Get tnx details by tx hash
const TxDetails = async (hash, query) => {
  let token_col = get_tnx_col_by(cfg.list_type.token),  // listOfTokens
      eth_col = get_tnx_col_by(cfg.list_type.eth),      // listOfETH
      q1 = findTokens(eth_col, query),    // Promise1 = ether tnxs
      q2 = findTokens(token_col, query);  // Promise2 = token tnxs
  // Do in parallel
  return await Promise.all([q1,q2])
    .then((data) => {
      let [ ether_tnxs, token_tnxs ] = data // 2d array destruct
      delete data;  // GC drop
      let response = {};

      if(ether_tnxs.length === 0) {  // if no ether tnxs ASK pending TNXS from eth_proxy node
        response.empty = true // no data flag
        // TODO: get data from eth_proxy
        // if found tnx => delete property response.empty
      } else {
        let txInner = [];
        ether_tnxs.forEach(tx => {
          response.head = {
            token: {
              addr:   tx.tokenaddr,
              name:   tx.tokenname,
              smbl:   tx.tokensmbl,
              dcm:    tx.tokendcm,
              type:   tx.tokentype,
            // new fields
            // "balance":"",
            // "icon":"",
            // "dynamic":0
            },
            ...tx // return all data AS IS
          }
          if(tx.isinner > 0) txInner.push(response.head)
        })

        token_tnxs.forEach(tx => {
          txInner.push(
            {
              token: {
                addr:   tx.tokenaddr,
                name:   tx.tokenname,
                smbl:   tx.tokensmbl,
                dcm:    tx.tokendcm,
                type:   tx.tokentype
              },
              ...tx // return all data AS IS
            }
          )
        })
        response.rows = txInner
        delete txInner
      }
      return response // return response object
    })
    .catch((e) => {
      throw e // return mongoDB error
    })
}

module.exports = {
  getDbTransactions:  GetDbTransactions, // common tnx get function (for block and tnx API)
  countTnx:           countTnx,          // count TNXS by ListId type
  TxDetails:          TxDetails
}
