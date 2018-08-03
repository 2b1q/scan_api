const cluster = require('cluster');

require(cluster.isMaster ? './master' : './worker');

// uncaughtException handler
process.on('uncaughtException', function(err) {
    console.error(new Date().toUTCString() + ' uncaughtException:', err.message);
    console.error(err.stack);
    process.exit(1);
});
