function encodeCall(web3, contract, functName, args) {
  let hash;
  contract.contract._jsonInterface.forEach((element) => {
    if (element.name == functName) {
      hash = web3.eth.abi.encodeFunctionCall(element, args);
    }
  });

  return hash;
}

module.exports = { encodeCall };
