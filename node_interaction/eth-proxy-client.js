// socket.io eth client
const io = require('socket.io-client'),
    cluster = require('cluster'),
    config = require('../config/config'),
    c = config.color;

// eth proxy io connector
const ethproxy = io.connect(
    config.interaction.ethURL,
    { reconnect: true }
);

// on connect event
ethproxy.on('connect', () => console.log(wid_ptrn(ethproxy.io.uri)));

// is IO connected
const ioconnected = () => ethproxy.io.connecting[0].connected;

// cluster.worker.id
const wid = cluster.worker.id;

// worker id pattern
const wid_ptrn = (endpoint) =>
    `${c.green}worker[${wid}]${c.red}[interaction]${c.cyan}[eth proxy client connected]${c.red} URI: ${c.green}[${endpoint}] ${c.white}`;

// io getAddressBalance  emitter
exports.getAddressBalance = (msg) =>
    new Promise((resolve, reject) => {
        if (ioconnected()) ethproxy.emit('getAddressBalance', msg, (resp) => resolve(resp));
        else reject('no connection to ETH proxy');
    });

// io getTransaction  emitter
exports.getTransaction = (msg) =>
    new Promise((resolve, reject) => {
        if (ioconnected()) ethproxy.emit('getTransaction', msg, (resp) => resolve(resp));
        else reject('no connection to ETH proxy');
    });

// io tokenBalance  emitter
exports.tokenBalance = (msg) =>
    new Promise((resolve, reject) => {
        if (ioconnected()) ethproxy.emit('tokenBalance', msg, (resp) => resolve(resp));
        else reject('no connection to ETH proxy');
    });
