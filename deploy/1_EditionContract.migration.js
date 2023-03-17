const EditionContract = artifacts.require("EditionContract");
const BaseProxy = artifacts.require("BaseProxy");

const { encodeCall } = require("../scripts/utils/callEncoder");

const URI = "";

module.exports = async (deployer) => {
  const editionContract = await deployer.deploy(EditionContract);
  await deployer.deploy(
    BaseProxy,
    encodeCall(web3, editionContract, "editionContractInit", [URI]),
    editionContract.address
  );
};
