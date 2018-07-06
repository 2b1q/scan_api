/*
* Single DB query model
* get collection query selector, params
* return DB data
*/
const db        = require('../libs/db'),
      cfg       = require('../config/config'),
      eth       = require('../ether/functions');

/* eth get data timeouts */
// wait timeout promise
const wait_ms = 50; // wait ms after each query
const wait = ms => new Promise(resolve => setTimeout(() => resolve(), ms));

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

// count collection docs by selector
const countTnx = async (collection, selector = {}) => {
  if(Array.isArray(collection)) {
    let promise_all_result = collection.map(async col_type => {
      let db_col = await col(col_type)
      return {
        [col_type]:  await db_col.count(selector)
      }
    })
    // wait all db request and construct one result object
    return await Promise.all(promise_all_result).then(data => Object.assign(...data))
  } else {
    let db_col = await col(collection)
    return {
      type: collection,
      cnt: await db_col.count(selector)
    }
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
    .then( async data => {
      let [ ether_tnxs, token_tnxs ] = data // 2d array destruct
      delete data;  // GC drop
      let response = {};

      if(ether_tnxs.length === 0) {  // if no ether tnxs ASK pending TNXS from eth_proxy node
        response.empty = true // no data flag
        // TODO: get data from eth_proxy

        let pending_tx = async () => {
          for (let i = 0; i < 5; i++) {
            // 0x28fc4495eaceaf8d37d7e401e31a2834cc2058fefa4f0ec9337432894e284207
            // let pending_tx = await eth.getTransaction('0x'+hash)
            let pending_tx = await eth.getTransaction('0x28fc4495eaceaf8d37d7e401e31a2834cc2058fefa4f0ec9337432894e284207')
            if(pending_tx === -1) await wait(wait_ms)
            else {
              console.log(pending_tx);
              break;
            }
          }
        }
        console.log(`-------get pending tx ${hash}-------`);
        await pending_tx()
        console.log('-------pending tx-------');

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

// find one db doc from collection using query pattern
const findOneQuery = async (collection, query = {}) => {
  let db_col = await col(collection)
  return new Promise(async (resolve, reject) => {
    let count = await db_col.count(query)
    if(count === 0) resolve ({ rows: count }) // fix (reject to resolve)
    else db_col.findOne(query).then(doc => resolve(doc))
  });
}

// find db doc from collection using query pattern
const findQuery = async (collection, query = {}) => {
  let db_col = await col(collection)
  return new Promise(async (resolve) => {
    let count = await db_col.count(query)
    if(count === 0) resolve ({ rows: count }) // fix (reject to resolve)
    else db_col.find(query)
          .toArray((err, docs) => {
            if(err) resolve({ rows: 0 })
            else resolve(docs)
          })
  });
}

// get block details by options
const GetBlock = async options => {
  console.log(options);
  let { block, block_col, ether_col, block_selector, tnx_selector } = options;
  // assign new Object 'inner_selector' from 'tnx_selector' and change 'isinner' property
  let inner_selector = Object.assign({}, tnx_selector, { isinner: 1 }); // fix bug with one object reference modification
  // TODO: mongo aggregation query (one group count query)
  // TODO: "tokentxcount" + "totaltxcount" (not used yet)
  let blockHeader_p = findOneQuery(block_col, block_selector)
  let mainTxCount_p = countTnx(ether_col, tnx_selector)
  let innerTxCount_p = countTnx(ether_col, inner_selector)
  // do in parallel, if block not found reject and drop other promises
  return await Promise.all([blockHeader_p, mainTxCount_p, innerTxCount_p])
    .then(([block, main, inner] = data) => {
      return({
        head: {
          ...block,
          maintxcount:  main.cnt,
          innertxcount: inner.cnt
        }
      })
    })
    .catch(e => e)
}

module.exports = {
  getDbTransactions:  GetDbTransactions, // common tnx get function (for block and tnx API)
  countTnx:           countTnx,          // count TNXS by ListId type
  TxDetails:          TxDetails,
  getBlock:           GetBlock,          // get block details by options
  findOne:            findOneQuery,      // find one db doc from collection using query pattern
  find:               findQuery          // find db docs from collection using query pattern
}
