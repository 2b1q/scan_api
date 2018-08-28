const config = {};

config.server = {
    port1: 3000,
    port2: 3001,
    ip: process.env.NODE_ENV == 'PROD' ? '95.213.165.61' : '192.168.1.87', // hardcoded
};

// cluster config workers (not by CPU count!)
config.workers = process.env.NODE_ENV == 'PROD' ? 4 : 2;

// DataStore config
config.store = {
    mongo: {
        uri: 'mongodb://localhost:26017/', // hardcoded
        dbname: 'bkx_main_2',
        options: {
            // autoIndex: false,
            poolSize: 10, // количество подключений в пуле
        },
        max_skip: 300000, // max skip size limit
    },
    cols: {
        eth: 'ether_txn',
        token: 'token_txn',
        block: 'block_header',
        token_head: 'token_header',
        contract: 'contract_header',
        erc20_cache: 'erc20_cache',
    },
};

// interaction with other SCAN API nodes
config.interaction = {
    ethURL: 'http://localhost:4000', // stand alone ETH proxy requests
    scanEngine: 'http://localhost:7009', // Scan Engine events and ETH proxy requests
};

// pager API v.1
config.page = {
    min_page: 1,
    max_page: 30000,
    min_size: 10,
    max_size: 200,
};

// pagination API v.2 (offset & size) properties
config.pagination = {
    min_offset: 0,
    max_offset: 300000,
    min_size: 1,
    max_size: 200,
};

// modules
config.modules = {
    tnx: 'transactions',
    block: 'block',
    addr: 'address',
    token: 'tokens',
};

// tx types list
config.list_type = {
    eth: 'listOfETH',
    token: 'listOfTokens',
    token_balance: 'listOfTokenBalance',
};

// socket io client evens
config.events = {
    client: {
        list: 'list',
        tx_d: 'txDetails',
        block_d: 'blockDetails',
        addr_d: 'addressDetails',
    },
};

// REST API options
config.restOptions = {
    context: '/api',
    logger: { file: 'restapi.log', level: 'error' },
    apiKeys: ['11111-1111-222-3333', 'q1w2e3r4', 'B@NKEX', 't0kEn'], // hardcoded
    domain: require('domain').create(),
};

config.ethOptions = {
    gethURLs: ['ws://localhost:8548'],
    maxNodesDelta: 20,
    upNodeFrequency: 10000,
    get_provider_retries: 5,
    get_provider_wait: 50,
};

// colorize console
config.color = {
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    black: '\x1b[30m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    white: '\x1b[37m',
};

module.exports = config;
