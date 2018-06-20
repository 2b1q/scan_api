const config = {};

config.server = {
  port: '3000',
  ip: (process.env.NODE_ENV == 'PROD') ? '95.213.165.61' : '192.168.1.87'
}

// cluster config
config.workers = (process.env.NODE_ENV == 'PROD') ? 4 : 2;

// DataStore config
config.store = {
  mongo: {
    uri: 'mongodb://localhost:27017/',
    dbname: 'scandb',
    options: {
      // autoIndex: false,
      poolSize: 10 // количество подключений в пуле
    }
  }
}

// REST API options
config.restOptions = {
  context: '/api',
  logger:{ file: 'restapi.log', level: 'error' },
	apiKeys: [ '11111-1111-222-3333', 'q1w2e3r4' ],
  domain: require('domain').create()
}

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
}

module.exports = config;
