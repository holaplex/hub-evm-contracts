const { artifacts, web3 } = require("hardhat");
const { toBN, accounts, wei } = require("../scripts/utils/utils");
const Reverter = require("./helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { getApproval } = require("../scripts/utils/permit");
const { ecsign } = require("ethereumjs-util");

const EditionContract = artifacts.require("EditionContract");
const WithoutReceive = artifacts.require("WithoutReceive");
const NFTSale = artifacts.require("NFTSale");
const BaseProxy = artifacts.require("BaseProxy");
const InterfaceId = artifacts.require("InterfaceId");

EditionContract.numberFormat = "BigInt";
WithoutReceive.numberFormat = "BigInt";
BaseProxy.numberFormat = "BigInt";
NFTSale.numberFormat = "BigInt";

const OWNER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe("NFTSale", () => {
  let OWNER;
  let SECOND;
  let THIRD;
  let FEE_RECEIVER;
  let nft;
  let nftSale;

  const reverter = new Reverter();

  before("setup", async () => {
    OWNER = await accounts(0);
    SECOND = await accounts(1);
    THIRD = await accounts(2);
    FEE_RECEIVER = await accounts(9);

    let _erc1155Edition = await EditionContract.new();
    let proxy = await BaseProxy.new("0x", _erc1155Edition.address);
    nft = await EditionContract.at(proxy.address);

    await nft.editionContractInit("http://");

    let _nftSale = await NFTSale.new();
    proxy = await BaseProxy.new("0x", _nftSale.address);
    nftSale = await NFTSale.at(proxy.address);

    await reverter.snapshot();
  });

  afterEach(async () => {
    reverter.revert();
  });

  describe("init", () => {
    it("should init", async () => {
      await truffleAssert.passes(nftSale.NFTSaleInit(nft.address));
    });

    it("should not initialize twice", async () => {
      await nftSale.NFTSaleInit(nft.address);
      await truffleAssert.reverts(nftSale.NFTSaleInit(nft.address), "Initializable: contract is already initialized");
    });
  });

  describe("initialized contract", () => {
    const feeNumerator = 10 ** 3;
    const amountToMint = 15;
    const editionId = 123;
    const editionInfo = {
      description: "description",
      imageUri: "/uri/1",
      collection: "Collection",
      uri: "placeholder://",
      creator: "0x76e98f7d84603AEb97cd1c89A80A9e914f181679",
    };

    const currentAmount = 5;
    const priceForToken = wei("1");

    beforeEach("init", async () => {
      await nft.createEdition(editionId, editionInfo, OWNER, amountToMint, FEE_RECEIVER, feeNumerator);

      await nftSale.NFTSaleInit(nft.address);
    });

    describe("createSale", () => {
      it("should create sale", async () => {
        await nft.approve(nftSale.address, editionId, amountToMint);

        await nftSale.createSale(editionId, currentAmount, priceForToken);
        let offerInStorage = await nftSale.offers(editionId, 0);

        assert.equal(offerInStorage.saler, OWNER);
        assert.equal(offerInStorage.isClosed, false);
        assert.equal(offerInStorage.tokenId, editionId);
        assert.equal(offerInStorage.currentAmount, currentAmount);
        assert.equal(offerInStorage.priceForToken, priceForToken);
      });

      it("should create sale not from contract owner", async () => {
        await nft.safeTransferFrom(OWNER, SECOND, editionId, currentAmount, "0x");

        await nft.approve(nftSale.address, editionId, currentAmount, { from: SECOND });

        await nftSale.createSale(editionId, currentAmount, priceForToken, { from: SECOND });
        let offerInStorage = await nftSale.offers(editionId, 0);

        assert.equal(offerInStorage.saler, SECOND);
        assert.equal(offerInStorage.isClosed, false);
        assert.equal(offerInStorage.tokenId, editionId);
        assert.equal(offerInStorage.currentAmount, currentAmount);
        assert.equal(offerInStorage.priceForToken, priceForToken);
      });

      it("should revert when allowance is insufficient", async () => {
        await nft.approve(nftSale.address, editionId, 0);

        await truffleAssert.reverts(
          nftSale.createSale(editionId, currentAmount, priceForToken),
          "NFTSale: insufficient allowance"
        );
      });

      it("should revert when tokens is insufficient", async () => {
        await nft.approve(nftSale.address, editionId, amountToMint);
        await nft.safeTransferFrom(OWNER, THIRD, editionId, amountToMint, "0x");

        await truffleAssert.reverts(
          nftSale.createSale(editionId, currentAmount, priceForToken),
          "NFTSale: insufficient amount"
        );
      });
    });

    describe("createSalePermit", () => {
      it("should create sale", async () => {
        const deadline = Date.now() + 1000;
        const chainId = await web3.eth.getChainId();
        const nonce = 0;
        const name = "ERC1155Permit";

        const approve = {
          owner: OWNER,
          spender: nftSale.address,
          id: editionId,
          value: currentAmount,
        };

        let msg = await getApproval(nft, name, approve, nonce, deadline, chainId);
        let { r, s, v } = ecsign(Buffer.from(msg.slice(2), "hex"), Buffer.from(OWNER_KEY.slice(2), "hex"));

        await nftSale.createSalePermit(editionId, currentAmount, priceForToken, OWNER, deadline, v, r, s);

        let offerInStorage = await nftSale.offers(editionId, 0);

        assert.equal(offerInStorage.saler, OWNER);
        assert.equal(offerInStorage.isClosed, false);
        assert.equal(offerInStorage.tokenId, editionId);
        assert.equal(offerInStorage.currentAmount, currentAmount);
        assert.equal(offerInStorage.priceForToken, priceForToken);
      });
    });

    describe("deleteSale", () => {
      it("should delete", async () => {
        await nft.approve(nftSale.address, editionId, amountToMint);

        await nftSale.createSale(editionId, currentAmount, priceForToken);

        await nftSale.deleteSale(editionId, 0);

        assert.equal((await nftSale.offers(editionId, 0)).isClosed, true);
      });

      it("should delete when offer amount = 0", async () => {
        await nftSale.createSale(editionId, 0, priceForToken);

        await nftSale.deleteSale(editionId, 0, { from: SECOND });

        assert.equal((await nftSale.offers(editionId, 0)).isClosed, true);
      });

      it("should pass, but not delete", async () => {
        await nft.approve(nftSale.address, editionId, amountToMint);

        await nftSale.createSale(editionId, currentAmount, priceForToken);

        await nftSale.deleteSale(editionId, 0, { from: SECOND });

        assert.equal((await nftSale.offers(editionId, 0)).isClosed, false);
      });
    });

    describe("buy", () => {
      const saleId = 0;
      const denominator = toBN("10000");

      const fee = (price) => {
        return toBN(price).times(feeNumerator).div(denominator);
      };

      beforeEach(async () => {
        await nft.approve(nftSale.address, editionId, amountToMint);
        await nftSale.createSale(editionId, currentAmount, priceForToken);
      });

      it("should buy", async () => {
        const ownerBefore = await web3.eth.getBalance(OWNER);
        const feeReceiverBefore = await web3.eth.getBalance(FEE_RECEIVER);
        const beforeBalance = await web3.eth.getBalance(SECOND);
        const tx = await nftSale.buy(editionId, saleId, 1, { from: SECOND, value: wei("2") });
        const afterBalance = await web3.eth.getBalance(SECOND);

        assert.equal(
          toBN(beforeBalance)
            .minus(toBN(tx.receipt.gasUsed).times(tx.receipt.effectiveGasPrice))
            .minus(priceForToken)
            .toString(),
          toBN(afterBalance).toString()
        );

        assert.equal(await nft.balanceOf(SECOND, editionId), 1);
        assert.equal(
          toBN(await web3.eth.getBalance(OWNER)).toString(),
          toBN(ownerBefore).plus(priceForToken).minus(fee(priceForToken)).toString()
        );
        assert.equal(
          toBN(await web3.eth.getBalance(FEE_RECEIVER)).toString(),
          toBN(feeReceiverBefore).plus(fee(priceForToken)).toString()
        );
      });

      it("should close sale", async () => {
        await nftSale.buy(editionId, saleId, currentAmount, { from: SECOND, value: wei(currentAmount * 2) });

        assert.equal((await nftSale.offers(editionId, saleId)).isClosed, true);
      });

      it("should spend all eth", async () => {
        const beforeBalance = await web3.eth.getBalance(SECOND);
        const tx = await nftSale.buy(editionId, saleId, 1, {
          from: SECOND,
          value: wei(1),
        });
        const afterBalance = await web3.eth.getBalance(SECOND);

        assert.equal(
          toBN(beforeBalance)
            .minus(toBN(tx.receipt.gasUsed).times(tx.receipt.effectiveGasPrice))
            .minus(priceForToken)
            .toString(),
          toBN(afterBalance).toString()
        );

        assert.equal(await nft.balanceOf(SECOND, editionId), 1);
      });

      it("should revert when sale is closed", async () => {
        await nftSale.deleteSale(editionId, saleId);

        await truffleAssert.reverts(
          nftSale.buy(editionId, saleId, 1, { from: SECOND, value: wei("2") }),
          "NFTSale: sales closed"
        );
      });

      it("should revert when try to buy more than max", async () => {
        await truffleAssert.reverts(
          nftSale.buy(editionId, saleId, currentAmount + 1, { from: SECOND, value: wei("20") }),
          "NFTSale: insufficient token amount"
        );
      });

      it("should revert when try to spend less than need", async () => {
        await truffleAssert.reverts(
          nftSale.buy(editionId, saleId, currentAmount, { from: SECOND, value: wei("2") }),
          "NFTSale: insufficient MATIC amount"
        );
      });

      it("should revert when saler out of tokens", async () => {
        await nft.safeTransferFrom(OWNER, THIRD, editionId, amountToMint, "0x");

        await truffleAssert.reverts(
          nftSale.buy(editionId, saleId, currentAmount, { from: SECOND, value: wei("20") }),
          "NFTSale: saler out of balance"
        );
      });

      it("should revert when sales contract out of allowance", async () => {
        await nft.approve(nftSale.address, editionId, 0);

        await truffleAssert.reverts(
          nftSale.buy(editionId, saleId, currentAmount, { from: SECOND, value: wei("20") }),
          "NFTSale: insufficient saler's allowance"
        );
      });

      it("should rever when eth send fails", async () => {
        let withoutReceive = await WithoutReceive.new(nftSale.address);

        await truffleAssert.reverts(
          withoutReceive.buy(editionId, saleId, 1, { value: wei("20") }),
          "NFTSale: failed to send ETH"
        );
      });
    });

    describe("supportsInterface()", () => {
      it("should pass", async () => {
        let idGetter = await InterfaceId.new();

        assert.equal(await nftSale.supportsInterface(await idGetter.getINFTSale()), true);
      });
    });
  });
});
