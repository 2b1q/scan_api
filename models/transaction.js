/*
- transaction model
*/
const db = require('../libs/db')

// get collection by name
let col = name => new Promise((resolve, reject) =>
  db.get.then(db_con => resolve(db_con.collection(name)))
);

// count all tnxs
let CountTnx = async () => {
  let db_col = await col('token_txn')
  return await db_col.count({})
}
// get last tnxs using options
let GetLastTransactions = async (options = {}) => {
  let { Page, Size, ListId } = options;
  let db_col = await col('token_txn')
  // console.log(db_col.count({}, (err,cnt) => {
  //   console.log(`token_txn cnt => ${cnt}`);
  // }));
  return await db_col.count({})
}

let TxDetails = async () =>{}

module.exports = {
  getLastTnxs: GetLastTransactions, // from api.GetLastTransactions
  countTnx:    CountTnx,
  txDetails:   TxDetails            // from TxDetails > api.GetTransaction(req.Hash)
}
/*
GetLastTransactions(req.Params.Page,req.Params.Size,req.ListId){
OK Response{
		Head: structs.ListHead{
			TotalEntities: count,
			PageNumber: page,
			PageSize: size,
			ModuleId: req.ModuleId,
			ListId: req.ListId,
			UpdateTime: time.Now(),
		},
		Rows: transactions,
	}

if 0 tnxs > {Error: "Not found", Head: bson.M{}, Rows: []int{}}
}

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
  restapi.LastTransactions(request)
  restapi.LastTransactions(request)
  restapi.AddrTransactions(request)
  restapi.BlockTransactions(request)
}

(CMD_HEAD_ADDR) CmdAddressDetails{
  restapi.AddrDetails(request)
}

CmdNodesDetails{
  eth_proxy.EthProxy.GetPoints()
}

(CMD_HEAD_BLOCK) CmdBlockDetails{
  restapi.BlockDetails(request)
}

(CMD_HEAD_HASH) CmdTxDetails{
  restapi.TxDetails(request)
}

*/
