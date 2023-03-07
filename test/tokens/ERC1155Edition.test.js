const { toBN, accounts, wei } = require("../../scripts/utils/utils");
const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { artifacts, web3 } = require("hardhat");

const ERC1155Edition = artifacts.require("ERC1155Edition");
const BaseProxy = artifacts.require("BaseProxy");

ERC1155Edition.numberFormat = "BigInt";
BaseProxy.numberFormat = "BigInt";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("ERC1155Edition", () => {
  let OWNER;
  let SECOND;
  let nft;

  const reverter = new Reverter();

  before("setup", async () => {
    OWNER = await accounts(0);
    SECOND = await accounts(1);

    let _erc1155Edition = await ERC1155Edition.new();
    let proxy = await BaseProxy.new("0x", _erc1155Edition.address);
    nft = await ERC1155Edition.at(proxy.address);

    await reverter.snapshot();
  });

  afterEach(async () => {
    reverter.revert();
  });

  describe("init", () => {
    it("should init", async () => {
      await truffleAssert.passes(nft.__ERC1155Edition_init("http://"));
    });

    it("should not initialize twice", async () => {
      await nft.__ERC1155Edition_init("http://");
      await truffleAssert.reverts(
        nft.__ERC1155Edition_init("http://"),
        "Initializable: contract is already initialized"
      );
    });
  });

  describe("initialized contract", () => {
    const amount = 15;
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

    beforeEach("init and mint", async () => {
      await nft.__ERC1155Edition_init("http://");
    });

    describe("createEdition()", () => {
      it("should create a new edition with the correct metadata", async () => {
        let tx = await nft.createEdition(editionId, editionInfo, amount);

        let editionInfoContract = await nft.editions(editionId);

        assert.equal(editionInfoContract.info.description, editionInfo.info.description);
        assert.equal(editionInfoContract.info.imageUri, editionInfo.info.imageUri);
        assert.equal(editionInfoContract.info.collection, editionInfo.info.collection);
        assert.equal(editionInfoContract.info.uri, editionInfo.info.uri);

        assert.equal(editionInfoContract.creator, editionInfo.creator);
        assert.equal(editionInfoContract.owner, OWNER);
        assert.equal(editionInfoContract.isEditEnabled, editionInfo.isEditEnabled);
        assert.equal(editionInfoContract.createdAt, (await web3.eth.getBlock(tx.receipt.blockHash)).timestamp);

        assert.equal(await nft.balanceOf(OWNER, editionId), amount);
      });

      it("should revert when caller is not owner", async () => {
        await truffleAssert.reverts(
          nft.createEdition(editionId, editionInfo, amount, { from: SECOND }),
          "Ownable: caller is not the owner"
        );
      });

      it("should revert when edition already exists", async () => {
        await nft.createEdition(editionId, editionInfo, amount);

        await truffleAssert.reverts(
          nft.createEdition(editionId, editionInfo, amount),
          "ERC1155Edition: edition already exists"
        );
      });
    });

    describe("transferEditionOwnership()", () => {
      beforeEach("create edition", async () => {
        await nft.createEdition(editionId, editionInfo, amount);
      });

      it("should move transfer edition ownership", async () => {
        await nft.transferEditionOwnership(editionId, SECOND);

        assert.equal((await nft.editions(editionId)).owner, SECOND);
      });

      it("should revert when try to call from not edition owner", async () => {
        await truffleAssert.reverts(
          nft.transferEditionOwnership(editionId, SECOND, { from: SECOND }),
          "ERC1155Edition: not edititon owner"
        );
      });

      it("should revert when try to transfer to zero address", async () => {
        await truffleAssert.reverts(nft.transferEditionOwnership(editionId, ZERO_ADDRESS));
      });
    });

    describe("mint()", () => {
      beforeEach("create edition", async () => {
        await nft.createEdition(editionId, editionInfo, amount);
      });

      it("should mint 100 tokens", async () => {
        await nft.mint(SECOND, editionId, 100);

        assert.equal(await nft.balanceOf(SECOND, editionId), 100);
      });

      it("should revert when try to call from not edition owner", async () => {
        await truffleAssert.reverts(
          nft.mint(SECOND, editionId, 100, { from: SECOND }),
          "ERC1155Edition: not edititon owner"
        );
      });
    });

    describe("uri()", () => {
      it("should correctly return token uri", async () => {
        await nft.createEdition(editionId, editionInfo, amount);

        assert.equal(editionInfo.info.uri, await nft.uri(editionId));
      });
    });

    describe("disableEdit()", () => {
      beforeEach(async () => {
        await nft.createEdition(editionId, editionInfo, amount);
      });

      it("should disable edit", async () => {
        await nft.disableEdit(editionId);

        assert.equal(false, (await nft.editions(editionId)).isEditEnabled);
      });

      it("should revert when try to call from not edition owner", async () => {
        await truffleAssert.reverts(nft.disableEdit(editionId, { from: SECOND }), "ERC1155Edition: not edititon owner");
      });

      it("should revert when edit disabled", async () => {
        await nft.disableEdit(editionId);
        await truffleAssert.reverts(nft.disableEdit(editionId), "ERC1155Edition: edit disabled");
      });
    });

    describe("editEdition()", () => {
      const newInfo = {
        description: "newDescription",
        imageUri: "/uri/new",
        collection: "newCollection",
        uri: "placeholder://new",        
        creator: "0x76e98f7d84603AEb97cd1c89A80A9e914f181679",
      };

      it("should correctly edit edition", async () => {
        await nft.createEdition(editionId, editionInfo, amount);

        await nft.editEdition(editionId, newInfo);

        let editionInfoContract = await nft.editions(editionId);

        assert.equal(newInfo.description, editionInfoContract.info.description);
        assert.equal(newInfo.imageUri, editionInfoContract.info.imageUri);
        assert.equal(newInfo.collection, editionInfoContract.info.collection);
        assert.equal(newInfo.uri, editionInfoContract.info.uri);
      });

      it("should revert when try to call from not edition owner", async () => {
        await truffleAssert.reverts(
          nft.editEdition(editionId, newInfo, { from: SECOND }),
          "ERC1155Edition: not edititon owner"
        );
      });

      it("should revert when edit disabled", async () => {
        await nft.createEdition(editionId, editionInfo, amount);
        await nft.disableEdit(editionId);
        await truffleAssert.reverts(nft.editEdition(editionId, newInfo), "ERC1155Edition: edit disabled");
      });
    });
  });
});
