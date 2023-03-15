const EditionContract = artifacts.require("EditionContract");
const BaseProxy = artifacts.require("BaseProxy");

const URI = "";

module.exports = async (deployer) => {
  const editionContract = await deployer.deploy(EditionContract);
  const proxyAddress = (await deployer.deploy(BaseProxy, "0x", editionContract.address)).address;
  const contract = await EditionContract.at(proxyAddress);

  await contract.__EditionContract_init(URI);
};
