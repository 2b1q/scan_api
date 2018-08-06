const Web3 = require("web3"),
  config = require("../config/config"),
  c = config.color,
  cluster = require("cluster");

// worker id pattern
const wid_ptrn = (() =>
  `${c.green}worker[${cluster.worker.id}]${c.cyan}[subscribe] ${c.white}`)();
const cid_ptrn = cid => `${c.yellow}${cid}${c.white}`;

function resubscribeIsRequired(c_id, ethProxy) {
  // let wid = cluster.worker.id;

  if (c_id < ethProxy.ethClients.length && c_id >= 0) {
    if (
      ethProxy.ethClients[c_id].subscribe &&
      ethProxy.ethClients[c_id].provider
    ) {
      if (ethProxy.ethClients[c_id].subscribe.id) {
        if (
          ethProxy.lastBlock - ethProxy.ethClients[c_id].lastBlock >
          config.ethOptions.maxNodesDelta
        ) {
          console.log(
            `${wid_ptrn}resubscribeIsRequired: behind the group - resubscribe ${cid_ptrn(
              c_id
            )}`
          );
          return true;
        } else {
          return false;
        }
      } else {
        console.log(
          `${wid_ptrn}resubscribeIsRequired: subscribe ID is NULL - resubscribe ${cid_ptrn(
            c_id
          )}`
        );
        return true;
      }
    } else {
      console.log(
        `${wid_ptrn}resubscribeIsRequired: not subscribe or provider object - resubscribe ${cid_ptrn(
          c_id
        )}`
      );
      return true;
    }
  } else {
    console.log(`${wid_ptrn}resubscribeIsRequired: Out of index range`);
    return false;
  }
}

function resubscribe(c_id, ethProxy) {
  if (c_id < ethProxy.ethClients.length && c_id >= 0) {
    ethProxy.ethClients[c_id].subscribe = ethProxy.ethClients[c_id].provider.eth
      .subscribe("newBlockHeaders", function(e, data) {
        if (e) console.log(`${wid_ptrn}FAILED to connect ${cid_ptrn(c_id)}`);
      })
      .on("data", function(blockHeader) {
        console.log(
          `${wid_ptrn}New block ${cid_ptrn(c_id)} ==> ${c.yellow}${
            blockHeader.number
          }${c.white}`
        );
        ethProxy.ethClients[c_id].lastBlock = blockHeader.number;
        if (ethProxy.ethClients[c_id].lastBlock > ethProxy.lastBlock)
          ethProxy.lastBlock = ethProxy.ethClients[c_id].lastBlock;
      });
  }
}

function subscribe(ethProxy) {
  for (let i = 0; i < ethProxy.ethClients.length; i += 1) {
    if (resubscribeIsRequired(i, ethProxy)) {
      let url = ethProxy.ethClients[i].url;
      ethProxy.ethClients[i].provider = new Web3(
        new Web3.providers.WebsocketProvider(url),
        2000
      );

      setTimeout(function() {
        if (ethProxy.ethClients[i].subscribe) {
          ethProxy.ethClients[i].subscribe.unsubscribe(function(
            error,
            success
          ) {
            if (success) {
              console.log(
                `${wid_ptrn}Successfully unsubscribed! Resubscribe started`
              );
              resubscribe(i, ethProxy);
            }
          });
        } else {
          resubscribe(i, ethProxy);
        }
      }, 2100);
    } else {
      console.log(
        `${wid_ptrn}Provider is OK : ${c.yellow}${i}${
          c.white
        } | subscrobe ID = ${c.magenta}${ethProxy.ethClients[i].subscribe.id}${
          c.white
        }`
      );
    }
  }
}

module.exports = {
  subscribe: subscribe
};
