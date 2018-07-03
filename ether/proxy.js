/*
* eth_proxy module
*/

const Web3 = require('web3');

const config = require('../config/config'),
      logger = require('../utils/logger')(module);

let ethClients = [],
    lastBlock = 0,
    c = config.color,
    gethUrls = config.ethOptions.gethURLs;

function resubscribeIsRequired(client_id) {

    if (client_id < ethClients.length && client_id >= 0) {
        if (ethClients[client_id].subscribe && ethClients[client_id].provider) {
            if (ethClients[client_id].subscribe.id) {
                console.log("delta = ", lastBlock - ethClients[client_id].lastBlock);
                return (lastBlock - ethClients[client_id].lastBlock > config.ethOptions.maxNodesDelta);
            } else {
                console.log("subscribe ID is NULL - resubscribe required");
                return true;
            }
        } else {
            console.log("not subscribe or provider object - resubscribe required");
            return true;
        }
    } else {
        console.log("Out of index range - no resubscribe");
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


function subscribe(client_id){
    if (client_id < ethClients.length && client_id >= 0) {
        ethClients[client_id].subscribe = ethClients[client_id].provider.eth.subscribe('newBlockHeaders', function (e, data) {
            if (e)console.log(`${c.red}Failed connect to subscribe ${client_id}: ${c.white}${e}`);
        }).on("data", function(blockHeader){
            console.log(`${c.green}New block ${client_id}: ${c.white}${blockHeader.number}`);
            ethClients[client_id].lastBlock = blockHeader.number;
            if (ethClients[client_id].lastBlock > lastBlock) lastBlock = ethClients[client_id].lastBlock;
        });
    }
}

function resubscribe(){
    for (let i=0; i<ethClients.length; i+=1){
        if (resubscribeIsRequired(i)){

            ethClients[i].provider = new Web3(new Web3.providers.WebsocketProvider(ethClients[i].url), 2000);

            setTimeout(function () {
                if (ethClients[i].subscribe){
                    ethClients[i].subscribe.unsubscribe(function(error, success){
                        if(success) {
                            console.log('Successfully unsubscribed!');
                            subscribe(i)
                        }
                    });
                } else {
                    subscribe(i)
                }
            }, 2100);
        } else {
            console.log(`${c.green}Subscription is fine #${i}`);
        }
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

    resubscribe();
    setInterval(resubscribe, 10000);

};

const getLastBlocks = async (req, res) =>{
    console.log(ethClients.length);
    let tmpBlocks = [];
    console.log(ethClients);
    for (let i=0; i<ethClients.length; i+=1){
        tmpBlocks.push(ethClients[i].lastBlock);
        console.log(ethClients[i].lastBlock)
    }
    res.json({"nodes": tmpBlocks})

};

module.exports = {
    initEthProviders:  initEthProviders, // get DB instance
    getBestProvider: getBestProvider,
    getLastBlocks: getLastBlocks,
};
