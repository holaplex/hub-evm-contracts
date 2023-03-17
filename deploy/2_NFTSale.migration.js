const NFTSale = artifacts.require("NFTSale");
const EditionContract = artifacts.require("EditionContract");
const BaseProxy = artifacts.require("BaseProxy");

const { web3 } = require("hardhat");
const { encodeCall } = require("../scripts/utils/callEncoder");

module.exports = async (deployer, logger) => {
  const editionContract = await EditionContract.at((await BaseProxy.deployed()).address);
  const sale = await deployer.deploy(NFTSale);
  await deployer.deploy(BaseProxy, encodeCall(web3, sale, "NFTSaleInit", [editionContract.address]), sale.address);

  logger.logContracts(["EditionContract", editionContract.address], ["NFTSale", contract.address]);
};
