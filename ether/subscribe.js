const Web3 = require('web3');
const config = require('../config/config');

function resubscribeIsRequired(c_id, ethProxy) {

    if (c_id < ethProxy.ethClients.length && c_id >= 0) {
        if (ethProxy.ethClients[c_id].subscribe && ethProxy.ethClients[c_id].provider) {
            if (ethProxy.ethClients[c_id].subscribe.id) {
                if (ethProxy.lastBlock - ethProxy.ethClients[c_id].lastBlock > config.ethOptions.maxNodesDelta) {
                    console.log("resubscribeIsRequired: behind the group - resubscribe", c_id);
                    return true
                } else {
                    return false
                }
            } else {
                console.log("resubscribeIsRequired: subscribe ID is NULL - resubscribe", c_id);
                return true;
            }
        } else {
            console.log("resubscribeIsRequired: not subscribe or provider object - resubscribe", c_id);
            return true;
        }
    } else {
        console.log("resubscribeIsRequired: Out of index range");
        return false
    }
}

function resubscribe(c_id, ethProxy){
    if (c_id < ethProxy.ethClients.length && c_id >= 0) {
        ethProxy.ethClients[c_id].subscribe = ethProxy.ethClients[c_id].provider.eth.subscribe(
            'newBlockHeaders',
            function (e, data) {
                if (e) console.log("FAILED to connect", c_id);
            }
        ).on("data", function(blockHeader){
            console.log("New block", c_id, " ==> ", blockHeader.number);
            ethProxy.ethClients[c_id].lastBlock = blockHeader.number;
            if (ethProxy.ethClients[c_id].lastBlock > ethProxy.lastBlock)
                ethProxy.lastBlock = ethProxy.ethClients[c_id].lastBlock;
        });
    }
}

function subscribe(ethProxy){
    for (let i=0; i<ethProxy.ethClients.length; i+=1){
        if (resubscribeIsRequired(i, ethProxy)){

            let url = ethProxy.ethClients[i].url;
            ethProxy.ethClients[i].provider = new Web3(new Web3.providers.WebsocketProvider(url), 2000);

            setTimeout(function () {
                if (ethProxy.ethClients[i].subscribe){
                    ethProxy.ethClients[i].subscribe.unsubscribe(function(error, success){
                        if(success) {
                            console.log("Successfully unsubscribed! Resubscribe started");
                            resubscribe(i, ethProxy)
                        }
                    });
                } else {
                    resubscribe(i, ethProxy)
                }
            }, 2100);
        } else {
            console.log("Provider is OK :", i, " | subscrobe ID = ", ethProxy.ethClients[i].subscribe.id);
        }
    }
}

module.exports = {
    subscribe: subscribe,
};