/*
* Address model.
* inherited from GO API:
*  api.GetAddrTransactions("2a65aca4d5fc5b5c859090a6c34d164135398226", 1, 10, "txtype = 'tx'")
*  api.GetAddress("2a65aca4d5fc5b5c859090a6c34d164135398226")
*/
const MAX_SKIP  = require('../config/config').store.mongo.max_skip,
      cfg       = require('../config/config'),
      dbquery   = require('./db_query'),
      eth       = require('../ether/functions'); //getAddrBalance

/* Get address details:
*   GO api.GetAddress("2a65aca4d5fc5b5c859090a6c34d164135398226")
*/
const GetAddress = async addr => {
  let response = {}
  // construct query options for address details
  let options = {
    addr: addr,
    addr_col: cfg.store.cols.contract,              // get addr collection name
    ether_col: cfg.store.cols.eth,                  // get ether collection name
    addr_selector: { 'addr': addr },                // contract selector
    tnx_selector: {
      $or:[ { 'addrto':   addr },
            { 'addrfrom': addr } ]
    }  // tnx selector
  }
  let addr_balance = await eth.getAddrBalance(addr)
  console.log({addr_balance: addr_balance}); // DEBUG
  let addrHeader_p = dbquery.findOne(options.addr_col, options.addr_selector)
  let mainTxCount_p = dbquery.countTnx(options.ether_col, options.tnx_selector)
  return await Promise.all([addrHeader_p, mainTxCount_p])
    .then(([addrHeader, { cnt } ]) => {
      response.rows = []
      response.head = {
        addr:         addrHeader.addr || addr,
        maintxcount:  cnt || 0,
        coin:         'ETH',
        data:         null,
        decimals:     18,
        balance:      addr_balance,
        contract: 0, // dummy
        innertxcount: 0, // dummy
        tokentxcount: 0, // dummy
        totaltxcount: 0, // dummy
        toptokenbalances: [], // dummy
        totaltokens: 0, // dummy
        maxtx:      0 // dummy
      }
      return response
    })
    .catch(e => e)

  // TODO: GetAddrTokenBalance(clearAddr, 0, 5)
/*
"head":{
      "addr":"67ce27e3687099e4145a01ef91304531a4f29feb",
      "contract":0,
      "data":null,
      "maintxcount":1,
      "innertxcount":0,
      "tokentxcount":0,
      "totaltxcount":0,
      "maxtx":0,
      "balance":"0",
      "decimals":18,
      "coin":"ETH",
      "toptokenbalances":[

      ],
      "totaltokens":0
   }
*/
  // return await dbquery.getBlock(options)

}

async function RcpAddrBalance(addr) {} //dummy

/*
* Get address tnx:
*  GO api.GetAddrTransactions("2a65aca4d5fc5b5c859090a6c34d164135398226", 1, 10, "txtype = 'tx'")
*/
const GetAddrTransactions = async options => {
  let { addr, collection } = options;
  // addr tnx selector
  let selector = {
    $or:[ { 'addrto':   addr },
          { 'addrfrom': addr } ]
  }
  // count tnx by query selector
  let { cnt } = await dbquery.countTnx(collection, selector)
  if( cnt === 0 ) return { rows: [] } // stop flow
  if( cnt > MAX_SKIP ) cnt = MAX_SKIP;
  // construct query options for addr tnxs
  options = {
    max_skip: MAX_SKIP,
    selector: selector,
    sort: { 'block': -1 },
    ...options  // spread other options
  }
  return await dbquery.getDbTransactions(options)
}



module.exports = {
  getAddr:  GetAddress,
  addrTnxs: GetAddrTransactions
}
