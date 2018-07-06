/*
* Single DB query model
* get collection query selector, params
* return DB data
*/
const db        = require('../libs/db'),
      cfg       = require('../config/config'),
      ethProxy  = require('../ether/proxy').getInstance(),
      moment = require('moment'),
      check = require('../utils/checker').cheker();

/* eth get data timeouts */
// wait timeout promise
const wait_ms = 50; // wait ms after each query
const get_provider_retries = 5;
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
        /*
        { blockHash: '0x3e11deb35e3d8a1193dcc56009a5adc5281184b158a859d2c0185cce2aed1f37',
          blockNumber: 2581050,
          from: '0xbF5Eaf0B9508c84A1d63553aE304848E3A0D3E71',
          gas: 314150,
          gasPrice: '1000000000',
          hash: '0x28fc4495eaceaf8d37d7e401e31a2834cc2058fefa4f0ec9337432894e284207',
          input: '0x',
          nonce: 121315,
          to: '0x9791a933394f1b4243d29868C9E86c2bd9BC67A1',
          transactionIndex: 18,
          value: '10000000000000000',
          v: '0x2b',
          r: '0x2336053749f123e34af6bb0059732ad7e45bfe311e0ce994cf5ac94ce6c163fd',
          s: '0x31aa76931f2ea5863b87a9ea3f04a93456f887838f196e764d1e738a2dc39db4' }
        */

        /*
         On start before we havnt any block or provider - return undefined
         after we have a block - Web3 object return null OR data object
         provider.eth.getTransaction(hash) return Promise with data or null
        */
        let pending_tx = async () => {
          for (let i = 0; i < get_provider_retries; i++) {
            let provider = ethProxy.getBestProvider();
            if(provider) return await provider.eth.getTransaction('0x'+hash);
            else await wait(wait_ms)
          }
        }
        let tx = await pending_tx() // return Promise with null/data/undefined
        console.log(tx);
        // construct response data if tx -> Not null and Not undefined
        if(tx) {
          delete response.empty // first delete empty flag
          response.head = {
            token: {
              addr:     '',
              name:     'Ether',
              smbl:     'ETH',
              dcm:      18,
              type:     0,
              balance:  '',
              icon:     '',
              dynamic:  0
            },
            hash: tx.hash, // hash 32 Bytes - String: Hash of the transaction.
            block:  0,
            txfee:  '0',
            isotime: moment(),
            addfrom: check.cut0x(tx.from), // from - String: Address of the sender
            addrto: check.cut0x(tx.to), // to - String: Address of the receiver. null when its a contract creation transaction.
            value: parseInt(tx.value, 10).toString(16).toUpperCase(), // value - String: Value transferred in wei
            status: -1,
            gascost: parseInt(tx.gasPrice), // gasPrice - String: Gas price provided by the sender in wei.
            type: 'tx',
            data: tx.input, //input - String: The data sent along with the transaction.
            web3Payload: {
              ...tx
            }
          }
          response.rows = []
        }
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
              balance:  '',
              icon:     '',
              dynamic:  0
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
