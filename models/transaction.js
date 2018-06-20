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

module.exports = {
  getLastTnxs: GetLastTransactions,
  countTnx:    CountTnx
}
