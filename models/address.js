const db = require('../libs/db')

async function GetAddress(addr) {

}

async function RcpAddrBalance(addr) {

}

async function GetAddrTransactions(addr, page, size, listId){

}


module.exports = {
  getAddress: GetAddress(addr),
  rcpAddrBalance: RcpAddrBalance(addr),
  getAddrTransactions: GetAddrTransactions(addr, page, size, listId)
}
