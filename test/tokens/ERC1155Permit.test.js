const { toBN, accounts, wei } = require("../../scripts/utils/utils");
const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { artifacts, web3 } = require("hardhat");
const { ecsign, pubToAddress, bufferToHex, ecrecover } = require("ethereumjs-util");
const { getApproval, getDomainSeparator, PERMIT_TYPEHASH } = require("../../scripts/utils/permit");

const ERC1155Permit = artifacts.require("ERC1155PermitMock");
const BaseProxy = artifacts.require("BaseProxy");

ERC1155Permit.numberFormat = "BigInt";
BaseProxy.numberFormat = "BigInt";

const OWNER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const name = "ERC1155Permit";

describe("ERC1155Permit", () => {
  let OWNER;
  let SECOND;
  let erc1155;

  const reverter = new Reverter();

  before("setup", async () => {
    OWNER = await accounts(0);
    SECOND = await accounts(1);

    let _erc1155 = await ERC1155Permit.new();
    let proxy = await BaseProxy.new("0x", _erc1155.address);
    erc1155 = await ERC1155Permit.at(proxy.address);

    await reverter.snapshot();
  });

  afterEach(async () => {
    reverter.revert();
  });

  describe("init", () => {
    it("should init", async () => {
      await truffleAssert.passes(erc1155.__ERC1155PermitMock_init("http://"));
    });

    it("should not initialize twice", async () => {
      await erc1155.__ERC1155PermitMock_init("http://");
      await truffleAssert.reverts(
        erc1155.__ERC1155PermitMock_init("http://"),
        "Initializable: contract is already initialized"
      );
    });

    it("should fails in onlyInitializing", async () => {
      await truffleAssert.reverts(
        erc1155.__ERC1155PermitMock_init_fails("http://"),
        "Initializable: contract is not initializing"
      );
      await truffleAssert.reverts(
        erc1155.__ERC1155PermitUpgradeable_init_unchained_fails(),
        "Initializable: contract is not initializing"
      );
    });
  });

  describe("initialized contract", () => {
    beforeEach("init and mint", async () => {
      await erc1155.__ERC1155PermitMock_init("http://");
    });

    describe("permit()", () => {
      it("permit()", async () => {
        const owner = await accounts(0);
        const spender = await accounts(1);
        const id = 1;
        const value = 100;
        const nonce = 0;
        const deadline = Date.now() + 1000;
        const chainId = await web3.eth.getChainId();

        const approve = {
          owner: owner,
          spender: spender,
          id: id,
          value: value,
        };

        let msg = await getApproval(erc1155, name, approve, nonce, deadline, chainId);
        let { r, s, v } = ecsign(Buffer.from(msg.slice(2), "hex"), Buffer.from(OWNER_KEY.slice(2), "hex"));

        let pubKey = ecrecover(Buffer.from(msg.slice(2), "hex"), v, r, s);
        assert.equal(await erc1155.DOMAIN_SEPARATOR(), getDomainSeparator(erc1155.address, chainId, name));
        assert.equal(PERMIT_TYPEHASH, await erc1155.getPermitTypeHash());

        assert.equal(bufferToHex(pubToAddress(pubKey)), bufferToHex(Buffer.from(owner.slice(2), "hex")));

        assert.equal(await erc1155.getHashTypedDataV4(owner, spender, id, value, deadline), msg);

        await erc1155.permit(owner, spender, id, value, deadline, v, r, s);
      });

      it("should revert when deadline is outdate", async () => {
        const owner = await accounts(0);
        const spender = await accounts(1);
        const id = 1;
        const value = 100;
        const nonce = 0;
        const deadline = 1;
        const chainId = await web3.eth.getChainId();

        const approve = {
          owner: owner,
          spender: spender,
          id: id,
          value: value,
        };

        let msg = await getApproval(erc1155, name, approve, nonce, deadline, chainId);
        let { r, s, v } = ecsign(Buffer.from(msg.slice(2), "hex"), Buffer.from(OWNER_KEY.slice(2), "hex"));

        await truffleAssert.reverts(
          erc1155.permit(owner, spender, id, value, deadline, v, r, s),
          "ERC1155Permit: expired deadline"
        );
      });

      it("should revert when signer != owner", async () => {
        const owner = await accounts(0);
        const spender = await accounts(1);
        const id = 1;
        const value = 100;
        const nonce = 0;
        const deadline = Date.now() + 1000;
        const chainId = await web3.eth.getChainId();

        const approve = {
          owner: owner,
          spender: spender,
          id: id,
          value: value,
        };

        let msg = await getApproval(erc1155, name, approve, nonce, deadline, chainId);
        let { r, s, v } = ecsign(Buffer.from(msg.slice(2), "hex"), Buffer.from(OWNER_KEY.slice(2), "hex"));

        await truffleAssert.reverts(
          erc1155.permit(spender, spender, id, value, deadline, v, r, s),
          "ERC1155Permit: invalid signature"
        );
      });
    });

    describe("nonces()", () => {
      it("should correctly return nonce", async () => {
        const owner = await accounts(0);
        const spender = await accounts(1);
        const id = 1;
        const value = 100;
        const nonce = 0;
        const deadline = Date.now() + 1000;
        const chainId = await web3.eth.getChainId();

        const approve = {
          owner: owner,
          spender: spender,
          id: id,
          value: value,
        };

        let msg = await getApproval(erc1155, name, approve, nonce, deadline, chainId);
        let { r, s, v } = ecsign(Buffer.from(msg.slice(2), "hex"), Buffer.from(OWNER_KEY.slice(2), "hex"));

        assert.equal("0", await erc1155.nonces(OWNER));
        await erc1155.permit(owner, spender, id, value, deadline, v, r, s);
        assert.equal("1", await erc1155.nonces(OWNER));
      });
    });
  });
});
