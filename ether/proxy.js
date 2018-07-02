/*
* eth_proxy module
*/

const Web3 = require('web3');

const config = require('../config/config');

let ethClients = [], // reference to clients
    lastBlock = 0,
    c = config.color,
    gethUrls = config.ethOptions.gethURLs;

function resubscribeIsRequired(client_id) {

    if (client_id < ethClients.length && client_id >= 0) {
        let ethClient = ethClients[client_id];
        if (!ethClient.subscribe) {
            return true;
        } else {
            if (!ethClient.subscribe.id) {
                return true;
            } else {
                return (lastBlock - ethClient.lastBlock > config.ethOptions.maxNodesDelta);
            }
        }

    } else {
        return false
    }
}


function getBestProvider() {
    let tmpProviders;
    tmpProviders = [];
    for (let i=0; i<ethClients.length; i+=1){
        if (lastBlock <= ethClients[i].lastBlock && ethClients[i].lastBlock > 0){
            tmpProviders.push(ethClients[i].provider)
        }
    }

    if (tmpProviders.length > 0){
        return tmpProviders[Math.floor(Math.random() * tmpProviders.length)];
    } else {
        return false
    }
}

let initEthProviders = ()=>{
    for (let i=0; i<gethUrls.length; i+=1){
        ethClients.push({
            url: gethUrls[i],
            provider: null,
            lastBlock: 0,
            subscribe: null,
            id: i
        });
    }

    for (let i=0; i<ethClients.length; i+=1){
        ethClients[i].provider = new Web3(new Web3.providers.WebsocketProvider(ethClients[i].url));
    }

    setInterval(function () {
        for (let i=0; i<ethClients.length; i+=1){
            if (ethClients[i].provider) {
                if (resubscribeIsRequired(i)){

                    if (ethClients[i].subscribe){
                        ethClients[i].subscribe.unsubscribe(function(error, success){
                            if(success) console.log('Successfully unsubscribed!');
                        });
                    }

                    ethClients[i].subscribe = ethClients[i].provider.eth.subscribe('newBlockHeaders', function (e, data) {
                        if (e) {
                            console.log(`${c.red}Failed connect to subscribe ${ethClients[i].id}: ${c.white}${e}`);
                            ethClients[i].subscribe_id = this.id;
                        }
                    }).on("data", function(blockHeader){
                        console.log(`${c.green}New block ${ethClients[i].id}: ${c.white}${blockHeader.number}`);
                        ethClients[i].lastBlock = blockHeader.number;
                        if (ethClients[i].lastBlock > lastBlock) lastBlock = ethClients[i].lastBlock;
                    });
                } else {
                    console.log(`${c.green}Subscription is fine #${i}`);
                }
            } else {
                console.log(`${c.red}Provider is not defined #${i}`);
            }
        }

    }, 20000)
};


module.exports = {
    initEthProviders:  initEthProviders, // get DB instance
    getBestProvider: getBestProvider,
};
