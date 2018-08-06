let ethProxy = require("./proxy").getInstance();

const getLastBlocks = async (req, res) => {
  res.json({ nodes: ethProxy.getProvidersBlock() });
};

module.exports = {
  getLastBlocks: getLastBlocks
};
