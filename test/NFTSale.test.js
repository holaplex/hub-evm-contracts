const { artifacts, web3 } = require("hardhat");
const { toBN, accounts, wei } = require("../scripts/utils/utils");
const Reverter = require("./helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");

const ERC1155Edition = artifacts.require("ERC1155Edition");
const NFTSale = artifacts.require("NFTSale");
const BaseProxy = artifacts.require("BaseProxy");

ERC1155Edition.numberFormat = "BigInt";
BaseProxy.numberFormat = "BigInt";
NFTSale.numberFormat = "BigInt";

describe.only("NFTSale", () => {
  let OWNER;
  let SECOND;
  let nft;
  let nftSale;

  const reverter = new Reverter();

  before("setup", async () => {
    OWNER = await accounts(0);
    SECOND = await accounts(1);

    let _erc1155Edition = await ERC1155Edition.new();
    let proxy = await BaseProxy.new("0x", _erc1155Edition.address);
    nft = await ERC1155Edition.at(proxy.address);

    await nft.__ERC1155Edition_init("http://"); 

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
      await truffleAssert.passes(nftSale.__NFTSale_init(nft.address));
    });

    it("should not initialize twice", async () => {
      await nftSale.__NFTSale_init(nft.address);
      await truffleAssert.reverts(
        nftSale.__NFTSale_init(nft.address),
        "Initializable: contract is already initialized"
      );
    });
  });

  describe("initialized contract", () => {
    const feeNumerator = 10**3;
    const amountToMint = 15;
    const editionId = 123;
    const editionInfo = {
      owner: "0x76e98f7d84603AEb97cd1c89A80A9e914f181679",
      createdAt: 0,
      isEditEnabled: true,
      info: {
        description: "description",
        imageUri: "/uri/1",
        collection: "Collection",
        uri: "placeholder://",
        creator: "0x76e98f7d84603AEb97cd1c89A80A9e914f181679",
      },
    };

    const offer = {
        saler: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        isClosed: false,
        tokenId: editionId,
        currentAmount: 5,
        totalAmount: 5,
        priceForToken: wei("1"),
    }

    beforeEach("init", async () => {
        await nft.createEdition(editionId, editionInfo, amountToMint, feeNumerator);

        await nftSale.__NFTSale_init(nft.address);
    });

    describe("createSale", () => {
        it("should create sale", async () => {
            await nft.approve(nftSale.address, editionId, amountToMint);
        
            await nftSale.createSale(offer);

            let offerInStorage = await nftSale.getOffer(0);

            assert.equal(offerInStorage.saler, offer.saler);
            assert.equal(offerInStorage.isClosed, offer.isClosed);
            assert.equal(offerInStorage.editionId, offer.editionId);
            assert.equal(offerInStorage.currentAmount, offer.currentAmount);
            assert.equal(offerInStorage.totalAmount, offer.totalAmount);
            assert.equal(offerInStorage.priceForToken, offer.priceForToken);
        });

        it("should revert at onlyOwnerOrSpender modifier", async () => {
            await truffleAssert.reverts(nftSale.createSale(offer, {from:SECOND}), "NFTSale: caller is not the owner or spender");
        });
    });

    describe("createSalePermit", () => {

    });

    describe("deleteSale", () => {
        it("should delete", async () => {
          await nft.approve(nftSale.address, editionId, amountToMint);
      
          await nftSale.createSale(offer);

          await nftSale.deleteSale(0);

          assert.equal((await nftSale.getOffer(0)).isClosed, true);
        });

        it("should revert at onlyOwnerOrSpender modifier", async () => {
          await nft.approve(nftSale.address, editionId, amountToMint);
      
          await nftSale.createSale(offer);

          await truffleAssert.reverts(nftSale.deleteSale(0, {from: SECOND}), "NFTSale: caller is not the owner or spender");
        });
    });

    describe("buy", () => {
      const saleId = 0;
      const denominator = toBN("10000");

      const fee = (price) => { return toBN(price).times(feeNumerator).div(denominator) }

      beforeEach(async () => {
        await nft.approve(nftSale.address, editionId, amountToMint);
        await nftSale.createSale(offer);
      });
      
      it("should buy", async () => {
        const beforeBalance = await web3.eth.getBalance(SECOND);
        const tx = await nftSale.buy(saleId, 1, {from: SECOND, value: wei("2")});
        const afterBalance = await web3.eth.getBalance(SECOND);

        assert.equal(
          toBN(beforeBalance)
            .minus(toBN(tx.receipt.gasUsed).times(tx.receipt.effectiveGasPrice))
            .minus(offer.priceForToken)
            .minus(fee(offer.priceForToken))
            .toString(),
          toBN(afterBalance).toString()
          );

        assert.equal(await nft.balanceOf(SECOND, editionId), 1);
      });

      it("should close sale", async () => {
        await nftSale.buy(saleId, offer.currentAmount, {from: SECOND, value: wei(offer.currentAmount*2)});

        assert.equal((await nftSale.getOffer(saleId)).isClosed, true);
      });

      it("should spend all eth", async () => {
        const beforeBalance = await web3.eth.getBalance(SECOND);
        const tx = await nftSale.buy(saleId, 1, {from: SECOND, value: toBN(wei("1")).plus(fee(offer.priceForToken))});
        const afterBalance = await web3.eth.getBalance(SECOND);

        assert.equal(
          toBN(beforeBalance)
            .minus(toBN(tx.receipt.gasUsed).times(tx.receipt.effectiveGasPrice))
            .minus(offer.priceForToken)
            .minus(fee(offer.priceForToken))
            .toString(),
          toBN(afterBalance).toString()
          );

        assert.equal(await nft.balanceOf(SECOND, editionId), 1);
      });

      it("should revert when sale is closed", async () => {
        await nftSale.deleteSale(saleId);

        await truffleAssert.reverts(nftSale.buy(saleId, 1, {from: SECOND, value: wei("2")}),"NFTSale: sales closed");
      });

      it("should revert when try to buy more than max", async () => {
        await truffleAssert.reverts(nftSale.buy(saleId, offer.currentAmount+1, {from: SECOND, value: wei("2")}),"NFTSale: insufficient token amount");
      });

      it("should revert when try to spend less than need", async () => {
        await truffleAssert.reverts(nftSale.buy(saleId, offer.currentAmount, {from: SECOND, value: wei("2")}), "NFTSale: insufficient MATIC amount");
      });
    });
  });
});
