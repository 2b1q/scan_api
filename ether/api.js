let ethProxy = require('./proxy').getInstance();

const getLastBlock = async (req, res) => {
    console.log(ethProxy);
    res.json({"lastblock": ethProxy.getLastBlock()});
};

const getLastBlocks = async (req, res) =>{
    res.json({"nodes": ethProxy.getProvidersBlock()})
};

const getBestProvider = async (req, res) =>{
    let provider = ethProxy.getBestProvider();
    if (provider) res.json("OK"); else res.json("false");
};

module.exports = {
    getLastBlock: getLastBlock,
    getLastBlocks: getLastBlocks,
    getBestProvider: getBestProvider,
};