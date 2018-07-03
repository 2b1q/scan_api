let eth_proxy = require('./proxy');

const lastBlock = async (req, res) => {
    console.log("lastBlock => getInstance = ", eth_proxy.getInstance());
    let x = 0; //eth_proxy.getLastBlock();
    res.json({"lastblock": x});
};

const getLastBlocks = async (req, res) =>{
    //let x = eth_proxy.getProvidersBlock();
    res.json({"nodes": []})

};


module.exports = {
    lastBlock: lastBlock,
    getLastBlocks: getLastBlocks,
};