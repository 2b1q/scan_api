const config = {};

config.api_version = 'v. 2.1';
config.project = 'BANKEX SCAN';

config.server = {
    port1: 3000,
    port2: 3001,
    ip: process.env.NODE_ENV == 'PROD' ? '95.213.165.61' : '192.168.1.87', // hardcoded
};

// cluster config workers (not by CPU count!)
config.workers = process.env.NODE_ENV == 'PROD' ? 4 : 2;

// dcm constants
config.constants = {
    tokendcm: 0,
    ethdcm: 18,
    feedcm: 18,
};

// search constants
config.search = {
    MAX_RESULT_SIZE: 1000,
    DEFAULT_SIZE: 20,
};

// DataStore config
config.store = {
    mongo: {
        uri: 'mongodb://localhost:26017/', // hardcoded
        dbname: 'bkx_main_3',
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
        pending_tx: 'pending_txn',
        tx_data: 'data_txn',
    },
};

// cookie config for SSO JWT
config.cookie = {
    maxAge: 86400000, // 24h 86400 sec
    httpOnly: true,
};

config.sso = {
    refreshJwtURL: 'https://sso-dev.bankexlab.com/api/v1/token', // SSO POST refresh JWT endpoint
    logoutJwtURL: 'https://sso-dev.bankexlab.com/api/v1/logout', // SSO POST Logout Backend endpoint
};

// interaction with other SCAN API nodes
config.interaction = {
    ethURL: 'http://localhost:4000', // stand alone ETH proxy requests
    scanEngine: 'http://localhost:7009', // Scan Engine events and ETH proxy requests
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
    erc20: 'erc20Token',
};

// tx types list
config.list_type = {
    eth: 'listOfETH',
    token: 'listOfTokens',
    token_balance: 'listOfTokenBalance',
    token_price: 'listOfTokenPrice',
    token_holders: 'listOfHolders',
};

// socket io client evens
config.events = {
    client: {
        list: 'list',
        tx_d: 'txDetails',
        block_d: 'blockDetails',
        addr_d: 'addressDetails',
        search: 'search',
        erc20_det: 'erc20Details',
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
    // node-geth01 (172.31.38.183)
    // node-geth02 (172.31.41.24)
    // node-geth03 (172.31.42.253)
    // gethURLs: ['ws://192.168.1.151:8548'],
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
