const NFTSale = artifacts.require("NFTSale");
const EditionContract = artifacts.require("EditionContract");
const BaseProxy = artifacts.require("BaseProxy");

module.exports = async (deployer, logger) => {
  const editionContract = await EditionContract.at((await BaseProxy.deployed()).address);
  const sale = await deployer.deploy(NFTSale);
  const proxyAddress = (await deployer.deploy(BaseProxy, "0x", sale.address)).address;
  const contract = await NFTSale.at(proxyAddress);

  await contract.__NFTSale_init(editionContract.address);

  logger.logContracts(["EditionContract", editionContract.address], ["NFTSale", contract.address]);
};
