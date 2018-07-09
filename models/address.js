/*
* Address model.
* inherited from GO API:
*  api.GetAddrTransactions("2a65aca4d5fc5b5c859090a6c34d164135398226", 1, 10, "txtype = 'tx'")
*  api.GetAddress("2a65aca4d5fc5b5c859090a6c34d164135398226")
*/
const MAX_SKIP  = require('../config/config').store.mongo.max_skip,
      cfg       = require('../config/config'),
      dbquery   = require('./db_query'),
      config  = require('../config/config'),
      eth_func  = require('../ether/functions');

/* eth get data timeouts. */
const wait = ms => new Promise(resolve => setTimeout(() => resolve(), ms));


/* Get address details:
*   GO api.GetAddress("2a65aca4d5fc5b5c859090a6c34d164135398226")
*/
const GetAddress = async addr => {
  let response = {};
  // construct query options for address details

  let addr_balance_p = eth_func.providerEthProxy('getbalance', {addr: addr});
  let addrHeader_p = dbquery.findOne(cfg.store.cols.contract, { 'addr': addr });
  let mainTxCount_p = dbquery.countTnx(cfg.store.cols.eth, {$or:[{'addrto': addr }, {'addrfrom': addr}]});
  let tokenList_p = GetAddrTokenBalance(addr, 0, 5);

  return await Promise.all([addrHeader_p, mainTxCount_p, addr_balance_p, tokenList_p])
    .then(([addrHeader, { cnt }, eth_balance, tokenList]) => {
      response.rows = []
      response.head = {
        addr:         addrHeader.addr || addr,
        maintxcount:  cnt || 0,
        toptokenbalances: tokenList,
        coin:         'ETH',
        data:         null,
        decimals:     18,
        balance:      parseInt(eth_balance, 10).toString(16), // TODO: fix data convert in balance and tables
          // TODO: remove actions like parseInt(balance_in_hex) / 10^decimals on front-end and apps
          // TODO: balance recalc via web3 utils
        contract: 0, // dummy
        innertxcount: 0, // dummy
        tokentxcount: 0, // dummy
        totaltxcount: 0, // dummy
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

const GetAddrTokenBalance = async options => {
  let {addr, skip, size} = options;

  let lastCachedBlock = 0;

  let cachedTokenBlocks = async () => {
      for (i = 0; i < 5; i++) {
          let tokenCacheCol_p = await dbquery.find(
              config.store.cols.erc20_cache,
              {'addr': addr, 'lastblock': {'$gt': 0}});
          if(tokenCacheCol_p.rows === 0) await wait(50);
          else {
              tokenCacheCol_p.forEach(c_block => {
                  if(c_block.lastblock > lastCachedBlock) lastCachedBlock = c_block.lastblock;
                  return 0
              });
              break
          }
      }
      return 0 // done
  };

  // DEBUG: lastCachedBlock
  console.log(`lastCachedBlock before: ${lastCachedBlock}`);
  await cachedTokenBlocks();
  console.log(`lastCachedBlock after: ${lastCachedBlock}`);

  let cachedTokensList = [];
  let ctl_p = await dbquery.find(config.store.cols.erc20_cache, {'addr': addr, 'lastblock': 0});
  if(Array.isArray(ctl_p)) {
      console.log('---------------- cache_tokens_selector find query ----------------');
      console.log(ctl_p);
      cachedTokensList = ctl_p.map(item => {
          return {
              addr: item.tokenaddr,
              name: item.tokenname,
              smbl: item.tokensmbl,
              dcm:  item.tokendcm,
              type: 20,
              balance: item.value,
              icon: '/api/token/icon/'+item.tokenaddr,
              dynamic: 0
          }
      })
  }


  let last_tokens_selector = {
      $or:[ { 'addrto':   addr },
          { 'addrfrom': addr } ],
      'block': { $gt: lastCachedBlock },
      'tokentype': 20
  };
  let lastTokens = await dbquery.distinct(cfg.store.cols.token, last_tokens_selector, 'tokenaddr');

  console.log('---------------- last_tokens_selector distinct query ----------------');
  console.log(lastTokens);

};
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
