/*
 REST API v.2
 transaction controller
 */
const
    logger = require('../../utils/logger')(module),
    ethproxy = require('../../node_interaction/eth-proxy-client');


/** common tx details*/
const NodeStatus = async () => {
    try {
        return await ethproxy.getStatus().catch(() => null);
    } catch (e) {
        console.log(e);
        logger.error(e);
        return {error: e};
    }
};


module.exports = {
    NodeStatus: NodeStatus, // [HTTP REST] (API v.2) GetLast Tokens Transactions endpoint
};
