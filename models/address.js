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
  let response = {},
      lastCachedBlock = 0,
      wait_ms = 50, // wait ms after each query
      cache_col = 'erc20_cache'; // TODO move to config
  // construct query options for address details
  let options = {
    addr: addr,
    addr_col: cfg.store.cols.contract,              // get addr collection name
    ether_col: cfg.store.cols.eth,                  // get ether collection name
    addr_selector: { 'addr': addr },                // contract selector
    tnx_selector: {
      $or:[ { 'addrto':   addr },
            { 'addrfrom': addr } ]
    },  // tnx selector
    cache_col_selector: {
      'addr': addr, 'lastblock': {'$gt': 0}
    }
  }
  // get addr ETH balance from eth_proxy (Promise)
  let addr_balance_p = eth.getAddrBalance(addr)
  let addrHeader_p = dbquery.findOne(options.addr_col, options.addr_selector)
  let mainTxCount_p = dbquery.countTnx(options.ether_col, options.tnx_selector)
  // wait timeout promise
  let wait = ms => new Promise(resolve => setTimeout(() => resolve(), ms));
  // let tokenCacheCol_p = await dbquery.find(cache_col, options.cache_col_selector)
  // console.log('--------------');
  // console.log({tokenCacheCol_p:tokenCacheCol_p});
  // console.log('--------------');
  let cachedTokenBlocks = async () => {
    for (let i = 0; i < 5; i++) {
      let tokenCacheCol_p = await dbquery.find(cache_col, options.cache_col_selector)
      if(tokenCacheCol_p.length === 0) await wait(wait_ms)
      else {
        tokenCacheCol_p.forEach(c_block => {
          if(c_block.lastblock > lastCachedBlock) lastCachedBlock = c_block.lastblock
          // console.log({cachedTokenBlock: c_block}); // DEBUG:
        })
        break;
      }
    }
  }

  console.log(`lastCachedBlock before: ${lastCachedBlock}`);
  await cachedTokenBlocks();
  console.log(`lastCachedBlock after: ${lastCachedBlock}`);


  return await Promise.all([addrHeader_p, mainTxCount_p, addr_balance_p])
    .then(([addrHeader, { cnt }, eth_balance ]) => {
      response.rows = []
      response.head = {
        addr:         addrHeader.addr || addr,
        maintxcount:  cnt || 0,
        coin:         'ETH',
        data:         null,
        decimals:     18,
        balance:      eth_balance.toString(16), // TODO: fix data convert in balance and tables
                                                // TODO: remove actions like parseInt(balance_in_hex) / 10^decimals on front-end and apps
                                                // TODO: balance recalc via web3 utils
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
