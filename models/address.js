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


/*
api.GetAddrTransactions("2a65aca4d5fc5b5c859090a6c34d164135398226", 1, 10, "txtype = 'tx'")
api.GetAddress("2a65aca4d5fc5b5c859090a6c34d164135398226")
*/
