const config = {};

config.server = {
  port: '3000',
  ip: (process.env.NODE_ENV == 'PROD') ? '95.213.165.61' : '192.168.1.87' // hardcoded
};

// cluster config workers (not by CPU count!)
config.workers = (process.env.NODE_ENV == 'PROD') ? 4 : 2;

// DataStore config
config.store = {
  mongo: {
    uri: 'mongodb://192.168.1.11:27017/', // hardcoded
    dbname: 'bkx_testnet',
    options: {
      // autoIndex: false,
      poolSize: 10 // количество подключений в пуле
    },
    max_skip: 300000 // max skip size limit
  },
  cols: {
    eth:        'ether_txn',
    token:      'token_txn',
    block:      'block_header',
    token_head: 'token_header',
    contract:   'contract_header'
  }
};

// pager
config.page = {
  min_page: 1,
  max_page: 30000,
  min_size: 10,
  max_size: 200
};

// modules
config.modules = {
  tnx:    'transactions',
  block:  'block',
  addr:   'address',
  token:  'tokens'
};

// tx types list
config.list_type = {
  eth:    'listOfETH',
  token:  'listOfTokens'
};

// socket io client evens
config.events = {
  client: {
    list:    'list',
    tx_d:    'txDetails',
    block_d: 'blockDetails',
    addr_d:  'addressDetails'
  }
}

// REST API options
config.restOptions = {
  context: '/api',
  logger:{ file: 'restapi.log', level: 'error' },
	apiKeys: [ '11111-1111-222-3333', 'q1w2e3r4', 'B@NKEX','t0kEn' ], // hardcoded
  domain: require('domain').create()
};

config.ethOptions = {
    gethURLs: ["ws://94.130.171.164:8556"],
    maxNodesDelta: 20,
    upNodeFrequency: 10000,
};

// colorize console
config.color = {
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  white: "\x1b[37m"
};

module.exports = config;
