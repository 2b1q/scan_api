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
      c       = config.color,
      cluster = require('cluster');
      ethProxy  = require('../ether/proxy').getInstance();

      // eth       = require('../ether/functions'); //getAddrBalance

// worker id pattern
const wid_ptrn = (() => `${c.green}worker[${cluster.worker.id}]${c.cyan}[eth_db_model] ${c.white}`)()
const txt_ptrn = txt => `${c.yellow}${txt}${c.white}`

/* eth get data timeouts. */
const wait_ms = 50; // wait ms after each query
const get_provider_retries = 5;
const wait = ms => new Promise(resolve => setTimeout(() => resolve(), ms));


/* Get address details:
*   GO api.GetAddress("2a65aca4d5fc5b5c859090a6c34d164135398226")
*/
const GetAddress = async addr => {
  let response = {},
      lastCachedBlock = 0,
      cache_col = 'erc20_cache'; // TODO move to config
  // construct query options for address details
  let options = {
    addr: addr,
    addr_col: cfg.store.cols.contract,              // get addr collection name
    ether_col: cfg.store.cols.eth,                  // get ether collection name
    token_col: cfg.store.cols.token,                // get token collection name
    addr_selector: { 'addr': addr },                // contract selector
    tnx_selector: {
      $or:[ { 'addrto':   addr },
            { 'addrfrom': addr } ]
    },
    cache_col_selector: {
      'addr': addr, 'lastblock': {'$gt': 0}
    },
    cache_tokens_selector: {
      'addr': addr, 'lastblock': 0
    }
  }

  // eth_proxy (Promise) Function executor
  let provider  = async (fn, walletAddr, tokenAddr) => {
    for (let i = 0; i < get_provider_retries; i++) {
      console.log(`${wid_ptrn}get provider ${txt_ptrn(i+1)} times`);
      let provider = ethProxy.getBestProvider();
      if(provider) {
        console.log(`${wid_ptrn}${txt_ptrn('We have a ETH  provider!')}`);
        switch (fn) {
          case 'getbalance':
            console.log(`${wid_ptrn}\n\nexec eth.getBalance(${txt_ptrn(walletAddr)})\n`);
            return await provider.eth.getBalance(walletAddr)
            break;
          case 'tokenbalance':
            console.log(`${wid_ptrn}\n\nexec TokenBalance({ walletAddr: ${txt_ptrn(walletAddr)},
                    tokenAddr: ${txt_ptrn(tokenAddr)}})\n`);
            let erc20ABI = require('../ether/abi').erc20ABI;
            let erc20 = new provider.eth.Contract(erc20ABI, tokenAddr);
            return await erc20.methods.balanceOf(walletAddr).call()
            break;
          default:
            return await provider.eth.getBalance(addr)
        }
      }
      else await wait(wait_ms)
    }
  }

  // DEBUG:
  // let token_balance = await provider('tokenbalance', "c0c91f8e5718658ebcc31c0f57d2726be15901a8", "7c63a5f86740501599fe9a9f5e2f7246374b67e2")
  // console.log('---------------- token_balance ----------------');
  // console.log(`token_balance: ${token_balance}`);


  let addr_balance_p = provider('getbalance', addr)
  let addrHeader_p = dbquery.findOne(options.addr_col, options.addr_selector)
  let mainTxCount_p = dbquery.countTnx(options.ether_col, options.tnx_selector)

  let cachedTokenBlocks = async () => {
    for (i = 0; i < 5; i++) {
      let tokenCacheCol_p = await dbquery.find(cache_col, options.cache_col_selector)
      if(tokenCacheCol_p.rows === 0) await wait(30) //wait 30 ms
      else {
        tokenCacheCol_p.forEach(c_block => {
          if(c_block.lastblock > lastCachedBlock) lastCachedBlock = c_block.lastblock;
          return 0
        })
        break
      }
    }
    return 0 // done
  }
  // DEBUG: lastCachedBlock
  console.log(`lastCachedBlock before: ${lastCachedBlock}`);
  await cachedTokenBlocks()
  console.log(`lastCachedBlock after: ${lastCachedBlock}`);
  // set last_tokens_selector after cachedTokenBlocks()
  let last_tokens_selector = {
    $or:[ { 'addrto':   addr },
          { 'addrfrom': addr } ],
    'block': { $gt: lastCachedBlock },
    'tokentype': 20
  }
  // DEBUG:
  console.log('---------------- last_tokens_selector after cachedTokenBlocks() ----------------');
  console.log(last_tokens_selector);

  let cachedTokensList = []
  let ctl_p = await dbquery.find(cache_col, options.cache_tokens_selector)
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

  let lastTokens = await dbquery
    //(collection, query, key)
    .distinct(options.token_col, last_tokens_selector, 'tokenaddr')

  console.log('---------------- last_tokens_selector distinct query ----------------');
  console.log(lastTokens);


  return await Promise.all([addrHeader_p, mainTxCount_p, addr_balance_p])
    .then(([addrHeader, { cnt }, eth_balance = '0' ]) => { // eth_balance = '0' (NaN fix)
      console.log(`----------------- eth_balance => ${eth_balance}`);
      response.rows = []
      response.head = {
        addr:         addrHeader.addr || addr,
        maintxcount:  cnt || 0,
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
