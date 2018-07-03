let ethProxy = require('./proxy').getInstance();

const lastBlock = async (req, res) => {
    console.log(ethProxy);
    res.json({"lastblock": ethProxy.getLastBlock()});
};

const getLastBlocks = async (req, res) =>{
    res.json({"nodes": ethProxy.getProvidersBlock()})

};


module.exports = {
    lastBlock: lastBlock,
    getLastBlocks: getLastBlocks,
};