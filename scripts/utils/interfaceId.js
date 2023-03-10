function getInterfaceId(interface, withSupportsInterface) {
  let selector = web3.utils.hexToBytes("0x00000000");
  interface.contract._jsonInterface.map((item) => {
    if (item.type != "event" && (withSupportsInterface || item.name != "supportsInterface")) {
      selector = byteXOR(selector, web3.utils.hexToBytes(item.signature));
    }
  });

  return web3.utils.bytesToHex(selector);
}

function byteXOR(first, second) {
  let result = new Uint8Array(first.length);
  for (let i = 0; i < first.length; i++) {
    result[i] = first[i] ^ second[i];
  }
  return result;
}

module.exports = {
  getInterfaceId,
};
