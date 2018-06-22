/*
- transaction model
*/
const db        = require('../libs/db'),
      MAX_SKIP  = require('../config/config').store.mongo.max_skip;

// get collection by name
let col = name => new Promise((resolve, reject) =>
  db.get.then(db_con => resolve(db_con.collection(name)))
);

// get tnx db collection name by ListId
let get_tnx_col_by = ListId => ListId ==='listOfETH' ? 'ether_txn':'token_txn';

// count all tnxs by ListId type
let CountTnx = async ListId => {
  let tnx_col = get_tnx_col_by(ListId)
  let db_col = await col(tnx_col)
  return {
    type: tnx_col,
    cnt: await db_col.count({})
  }
}

/* get last tnxs
* Go e.g. api.GetLastTransactions(2, 10, "tx")
*/
let GetLastTransactions = async (options = {}) => {
  console.log(options);
  let { skip, page, size, ListId } = options;
  let tnx_col = get_tnx_col_by(ListId)
  let db_col = await col(tnx_col)
  let count = await db_col.count({})
  if(count > MAX_SKIP) count = MAX_SKIP
  return new Promise((resolve,reject) =>
    db_col.find({},{allowDiskUse: true}) // allowDiskUse lets the server know if it can use disk to store temporary results for the aggregation (requires mongodb 2.6 >)
      .sort({ 'block': -1 })
      .skip(skip)
      .limit(size)
      .toArray((err, docs) => {
        if(err) return reject(err) // stop flow and return reject with exeption
        let txns = docs.map(tx => {
          return {
            Token: {
              Addr:   tx.tokenaddr,
              Name:   tx.tokenname,
              Smbl:   tx.tokensmbl,
              Dcm:    tx.tokendcm,
              Type:   tx.tokentype
            },
            RcpLogs:  tx.rcplogs,
            Data:     tx.data
          }
        })
        // console.log(txns);
        resolve({
          page:page,
          size:size,
          count:count,
          Rows:txns
        })
      })
  );
}

let TxDetails = async () =>{}

module.exports = {
  getLastTnxs: GetLastTransactions, // from api.GetLastTransactions
  countTnx:    CountTnx,
  txDetails:   TxDetails            // from TxDetails > api.GetTransaction(req.Hash)
}
/*

TxDetails > api.GetTransaction(req.Hash){
OK return {Rows: txInner, Head: txMain}
ERROR return {Error: "Not found", Head: bson.M{}, Rows: []int{}}
}

*/

/*
api.GetLastTransactions(2, 10, "tx")
api.GetTransaction("e25db473556c7ecda92ebf7226ff022ef2f49fb11f03404d04987f69894f4548")
api.GetBlockTransactions(1000014, 2, 10, "txtype = 'tx'")
api.GetBlock(1000014)
api.GetBlock(10000)
api.GetBlock(0)
api.GetAddrTransactions("2a65aca4d5fc5b5c859090a6c34d164135398226", 1, 10, "txtype = 'tx'")
api.GetAddress("2a65aca4d5fc5b5c859090a6c34d164135398226")


CmdList {
  const MODULE_TXN = "transactions" > restapi.LastTransactions(request)
  const MODULE_TOKEN = "tokens" > restapi.LastTransactions(request)
  const MODULE_ADDR = "address" > restapi.AddrTransactions(request)
  const MODULE_BLOCK = "block" > restapi.BlockTransactions(request)
}

(CMD_HEAD_ADDR) CmdAddressDetails{
  restapi.AddrDetails(request)
}
(CMD_HEAD_BLOCK) CmdBlockDetails{
restapi.BlockDetails(request)
}
(CMD_HEAD_HASH) CmdTxDetails{
restapi.TxDetails(request)
}

CmdNodesDetails{
  eth_proxy.EthProxy.GetPoints()
}



*/
