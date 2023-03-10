const { pack: solidityPack } = require("@ethersproject/solidity");

const toBytes32 = (arg) => {
  return web3.utils.keccak256(Buffer.from(arg, "utf8"));
};

const PERMIT_TYPEHASH = toBytes32(
  "Permit(address owner,address spender,uint256 id,uint256 value,uint256 nonce,uint256 deadline)"
);

function getDomainSeparator(tokenAddress, chainId, name) {
  return web3.utils.keccak256(
    web3.eth.abi.encodeParameters(
      ["bytes32", "bytes32", "bytes32", "uint256", "address"],
      [
        toBytes32("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        toBytes32(name),
        toBytes32("1"),
        chainId,
        tokenAddress,
      ]
    )
  );
}

async function getApproval(token, name, approve, nonce, deadline, chainId) {
  const DOMAIN_SEPARATOR = getDomainSeparator(token.address, chainId, name);
  return web3.utils.keccak256(
    solidityPack(
      ["bytes1", "bytes1", "bytes32", "bytes32"],
      [
        "0x19",
        "0x01",
        DOMAIN_SEPARATOR,
        web3.utils.keccak256(
          web3.eth.abi.encodeParameters(
            ["bytes32", "address", "address", "uint256", "uint256", "uint256", "uint256"],
            [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.id, approve.value, nonce, deadline]
          )
        ),
      ]
    )
  );
}

module.exports = {
  getApproval,
  getDomainSeparator,
  PERMIT_TYPEHASH,
};
