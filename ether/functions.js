let ethProxy = require('./proxy').getInstance();
let erc20ABI = require('./abi').erc20ABI;
let config = require('../config/config');
let cluster = require('cluster');
const c = config.color;

const wid_ptrn = (() => `${c.green}worker[${cluster.worker.id}]${c.cyan}[eth_db_model] ${c.white}`)();
const txt_ptrn = (txt) => `${c.yellow}${txt}${c.white}`;
const wait = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

const providerEthProxy = async (fn, options) => {
    let response;
    for (let i = 0; i < config.ethOptions.get_provider_retries; i++) {
        console.log(`${wid_ptrn}get provider ${txt_ptrn(i + 1)} times`);
        let provider = ethProxy.getBestProvider();

        if (provider) {
            console.log(`${wid_ptrn}${txt_ptrn('We have a ETH  provider!')}`);
            switch (fn) {
                case 'getbalance':
                    console.log(`${wid_ptrn}\n\nexec eth.getBalance(${txt_ptrn(options.addr)})\n`);
                    try {
                        response = await provider.eth.getBalance(options.addr);
                    } catch (e) {
                        // connection not open Exp handler
                        console.log('---------getBalance( handled EXCEPTION )--------');
                        console.log(e);
                        console.log('---------EXCEPTION--------');
                    }
                    return response;
                    break;
                case 'tokenbalance':
                    console.log(`${wid_ptrn}\n\nexec TokenBalance({ walletAddr: ${txt_ptrn(options.walletAddr)},
                    tokenAddr: ${txt_ptrn(options.tokenAddr)}})\n`);
                    try {
                        let erc20 = new provider.eth.Contract(erc20ABI, options.tokenAddr);
                        response = await erc20.methods.balanceOf(options.walletAddr).call();
                    } catch (e) {
                        // connection not open Exp handler
                        console.log('---------TokenBalance( handled EXCEPTION )--------');
                        console.log(e);
                        console.log('---------EXCEPTION--------');
                    }
                    return response;
                    break;
                case 'tx':
                    console.log(`${wid_ptrn}\n\nexec eth.getTransaction(${txt_ptrn(options.hash)})\n`);
                    try {
                        response = await provider.eth.getTransaction(options.hash);
                    } catch (e) {
                        // connection not open Exp handler
                        console.log('---------getTransaction( handled EXCEPTION )--------');
                        console.log(e);
                        console.log('---------EXCEPTION--------');
                    }
                    return response;
                    break;
                default:
                    return await provider.eth.getBalance(options.addr);
            }
        } else await wait(config.ethOptions.get_provider_wait);
    }
};

module.exports = {
    providerEthProxy: providerEthProxy,
};
