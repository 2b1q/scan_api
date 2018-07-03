const config = require('../config/config');

const check_eth_clients_singleton = (() => {
    let ethProxy;

    let initSingleton = () => {
        const Web3 = require('web3');

        let gethUrls = config.ethOptions.gethURLs;
        let ethClients = [];

        for (let i=0; i<gethUrls.length; i+=1){
            ethClients.push({
                url: gethUrls[i],
                provider: null,
                lastBlock: 0,
                subscribe: null,
                id: i
            });
        }

        return {
            lastBlock: 0,
            ethClients: ethClients,

            getBestProvider: () => {
                let tmpProviders = [];
                let clients = this.ethClients;
                let last = this.lastBlock;
                for (let i=0; i<clients.length; i+=1){
                    if (last <= clients[i].lastBlock && clients[i].lastBlock > 0){
                        tmpProviders.push(clients[i].provider)
                    }
                }

                if (tmpProviders.length > 0){
                    return tmpProviders[Math.floor(Math.random() * tmpProviders.length)];
                } else {
                    return false
                }
            },

            getProvidersBlock: () => {
                let tmpBlocks = [];
                let clients = this.ethClients;
                console.log("getProvidersBlock, clients length = ", clients.length);
                for (let i=0; i<clients.length; i+=1){
                    tmpBlocks.push(clients[i].lastBlock);
                }
                return tmpBlocks;
            },

            getLastBlock: () => {
                console.log("getLastBlock, this.lastBlock = ", this.lastBlock);
                return this.lastBlock;
            }

        }
    };

    return {
        getInstance: () => {
            if(!ethProxy) {
                ethProxy = initSingleton();
            }
            return ethProxy
        }
    }
})();


module.exports.getInstance = () => check_eth_clients_singleton.getInstance();
