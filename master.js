let cluster = require('cluster'),
    config = require('./config/config'),
    ethProxy = require('./ether/proxy').getInstance(),
    ethSubs = require('./ether/subscribe');

ethSubs.subscribe(ethProxy);
setInterval(function () {
    ethSubs.subscribe(ethProxy)
}, 10000);

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
