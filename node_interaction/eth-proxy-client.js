// socket.io eth client
const io = require('socket.io-client'),
    cluster = require('cluster'),
    config = require('../config/config'),
    c = config.color;

// cluster.worker.id
const wid = cluster.worker.id;

// eth_proxy_ptrn pattern
const engine_proxy_ptrn = (endpoint) =>
    `${c.green}worker[${wid}]${c.red}[io client interaction]${c.cyan}[ScanEngine-proxy]${c.red} URI: ${c.green}${endpoint}${c.white}`;

// Scan Engine events and ETH proxy requests
const scanEngineProxy = io.connect(
    config.interaction.scanEngine,
    {
        reconnect: true,
        transports: ['websocket'],
    }
);

// on connect event
scanEngineProxy.on('connect', () => console.log(engine_proxy_ptrn(scanEngineProxy.io.uri + ' => [connected]')));
// on disconnect event
scanEngineProxy.on('disconnect', () => console.log(engine_proxy_ptrn(scanEngineProxy.io.uri + ' => [disconnected]')));

// scan engine ETH proxy emitter
const scanemit = (io, cmd, msg, resolve, reject) => {
    io.emit(
        'requestsChannel',
        JSON.stringify({
            cmd: cmd,
            version: 1,
            params: msg,
        }),
        (rsp) => {
            let response = JSON.parse(rsp);
            console.log(response);
            // if (!response.error) console.log(`ETH Engine BALANCE IS: ${response.data}`);
            if (!response.error) resolve(response.data);
            reject(response.error); // if error not empty => reject
        }
    );
};

// scan proxy node is IO connected
const scanproxyconnected = () => scanEngineProxy.io.connecting[0].connected;

// io getAddressBalance  emitter
exports.getAddressBalance = (msg) =>
    new Promise((resolve, reject) => {
        if (scanproxyconnected()) scanemit(scanEngineProxy, 'getEthereumBalance', msg, resolve, reject);
        else reject('no connection to ScanEngine ETH proxy');
    });

// io getTransaction  emitter
exports.getTransaction = (msg) =>
    new Promise((resolve, reject) => {
        if (scanproxyconnected()) scanemit(scanEngineProxy, 'getTransaction', msg, resolve, reject);
        else reject('no connection to ScanEngine ETH proxy');
    });

// io tokenBalance  emitter
exports.tokenBalance = (msg) =>
    new Promise((resolve, reject) => {
        console.log(`io tokenBalance: ${msg}`);
        if (scanproxyconnected()) scanemit(scanEngineProxy, 'getTokenBalance', msg, resolve, reject);
        else reject('no connection to ScanEngine ETH proxy');
    });

// io getStatus  emitter
exports.getStatus = () =>
    new Promise((resolve, reject) => {
        if (scanproxyconnected()) scanemit(scanEngineProxy, 'getStatus', "", resolve);
        else reject('no connection to ScanEngine ETH proxy');
    });
