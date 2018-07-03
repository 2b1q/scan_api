const check_eth_clients_singleton = (() => {
    let ethProxy;

    let initSingleton = () => {
        const config = require('../config/config');

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
                let self = this.getInstance();
                let tmpProviders = [];
                let clients = self.ethClients;
                let last = self.lastBlock;
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
                let self = this.getInstance();
                let tmpBlocks = [];
                let clients = self.ethClients;
                console.log("getProvidersBlock, clients length = ", clients.length);
                for (let i=0; i<clients.length; i+=1){
                    tmpBlocks.push(clients[i].lastBlock);
                }
                return tmpBlocks;
            },

            getLastBlock: () => {
                let self = this.getInstance();
                console.log("getLastBlock, this = ", this);
                console.log("getLastBlock, self.lastBlock = ", self.lastBlock);
                return self.lastBlock;
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
