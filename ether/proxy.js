const config = require('../config/config'),
    c = config.color,
    cluster = require('cluster');

// worker id pattern
const wid_ptrn = (() => `${c.green}worker[${cluster.worker.id}]${c.cyan}[proxy] ${c.white}`)();
const id_ptrn = (id) => `${c.yellow}${id}${c.white}`;

const check_eth_clients_singleton = (() => {
    let ethProxy;

    let initSingleton = () => {
        const config = require('../config/config');

        let gethUrls = config.ethOptions.gethURLs;
        let ethClients = [];

        /*        for (let i = 0; i < gethUrls.length; i += 1) {
            ethClients.push({
                url: gethUrls[i],
                provider: null,
                lastBlock: 0,
                subscribe: null,
                id: i,
            });
        }*/

        gethUrls.forEach((k, i) =>
            ethClients.push({
                url: k,
                provider: null,
                lastBlock: 0,
                subscribe: null,
                id: i,
            })
        );

        return {
            lastBlock: 0,
            ethClients: ethClients,

            getBestProvider: () => {
                // let self = this.getInstance();
                let self = ethProxy;
                let tmpProviders = [];
                let clients = self.ethClients;
                let last = self.lastBlock;

                clients.forEach((client) => {
                    if (last <= client.lastBlock && client.lastBlock > 0) {
                        tmpProviders.push(client.provider);
                    }
                });

                /*for (let i = 0; i < clients.length; i += 1) {
                    if (last <= clients[i].lastBlock && clients[i].lastBlock > 0) {
                        tmpProviders.push(clients[i].provider);
                    }
                }*/

                if (tmpProviders.length > 0) {
                    return tmpProviders[Math.floor(Math.random() * tmpProviders.length)];
                } else {
                    return false;
                }
            },

            getProvidersBlock: () => {
                // let self = this.getInstance();
                let self = ethProxy;
                let tmpBlocks = [];
                let clients = self.ethClients;
                console.log(`${wid_ptrn}getProvidersBlock, clients length = ${id_ptrn(clients.length)}`);
                /*for (let i = 0; i < clients.length; i += 1) {
                    tmpBlocks.push(clients[i].lastBlock);
                }*/

                clients.forEach((client) => tmpBlocks.push(client.lastBlock));

                return tmpBlocks;
            },

            getLastBlock: () => {
                let self = ethProxy;
                // let self = this.getInstance();
                console.log(`${wid_ptrn}getLastBlock, this = ${this}`);
                console.log(`${wid_ptrn}getLastBlock, self.lastBlock = ${id_ptrn(self.lastBlock)}`);
                return self.lastBlock;
            },
        };
    };

    return {
        getInstance: () => {
            console.log('===== ETH PROXY Object========');
            console.log(ethProxy);
            console.log('===== ETH PROXY Object========');

            if (!ethProxy) {
                ethProxy = initSingleton();
            }
            return ethProxy;
        },
    };
})();

module.exports.getInstance = () => check_eth_clients_singleton.getInstance();
