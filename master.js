var cluster = require('cluster'),
    ethProxy = require('./ether/proxy'),
    config = require('./config/config');

// ethProxy.initEthProviders();

// if worker 'disconnect' from IPC channel
cluster.on('disconnect', (worker, code, signal) => {
    console.log('Worker %d died', worker.id);
    cluster.fork();
});

cluster.on('online', worker => {
    console.log(config.color.magenta+'Worker %d '+config.color.white+'online', worker.id)
});

// fork workers process (not by CPU cores)
for(let i = 0; i < config.workers; ++i) {
  cluster.fork();
}
