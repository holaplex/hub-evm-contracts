const { toBN, accounts, wei } = require("../../scripts/utils/utils");
const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { artifacts, web3 } = require("hardhat");

const EditionContract = artifacts.require("EditionContract");
const BaseProxy = artifacts.require("BaseProxy");

const InterfaceId = artifacts.require("InterfaceId");

EditionContract.numberFormat = "BigInt";
BaseProxy.numberFormat = "BigInt";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("EditionContract", () => {
  let OWNER;
  let SECOND;
  let nft;

  const reverter = new Reverter();

  before("setup", async () => {
    OWNER = await accounts(0);
    SECOND = await accounts(1);

    let _erc1155Edition = await EditionContract.new();
    let proxy = await BaseProxy.new("0x", _erc1155Edition.address);
    nft = await EditionContract.at(proxy.address);

    await reverter.snapshot();
  });

  afterEach(async () => {
    reverter.revert();
  });

  describe("init", () => {
    it("should init", async () => {
      await truffleAssert.passes(nft.editionContractInit("http://"));
    });

    it("should not initialize twice", async () => {
      await nft.editionContractInit("http://");
      await truffleAssert.reverts(nft.editionContractInit("http://"), "Initializable: contract is already initialized");
    });
  });

  describe("initialized contract", () => {
    const feeNumerator = 10 ** 3;
    const amount = 15;
    const editionId = 123;
    const editionInfo = {
      description: "description",
      imageUri: "/uri/1",
      collection: "Collection",
      uri: "placeholder://",
      creator: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    };

    beforeEach("init and mint", async () => {
      await nft.editionContractInit("http://");
    });

    describe("createEdition()", () => {
      it("should create a new edition with the correct metadata", async () => {
        let tx = await nft.createEdition(editionId, editionInfo, SECOND, amount, SECOND, feeNumerator);

        let editionInfoContract = await nft.editions(editionId);
        let info = await nft.royaltyInfo(editionId, 1);

        assert.equal(info[0], SECOND);

        assert.equal(editionInfoContract.info.description, editionInfo.description);
        assert.equal(editionInfoContract.info.imageUri, editionInfo.imageUri);
        assert.equal(editionInfoContract.info.collection, editionInfo.collection);
        assert.equal(editionInfoContract.info.uri, editionInfo.uri);
        assert.equal(editionInfoContract.info.creator, editionInfo.creator);

        assert.equal(editionInfoContract.owner, SECOND);
        assert.equal(await nft.ownerOf(editionId), SECOND);
        assert.equal(editionInfoContract.isEditEnabled, true);
        assert.equal(editionInfoContract.createdAt, (await web3.eth.getBlock(tx.receipt.blockHash)).timestamp);

        assert.equal(await nft.balanceOf(SECOND, editionId), amount);
      });

      it("should revert when caller is not owner", async () => {
        await truffleAssert.reverts(
          nft.createEdition(editionId, editionInfo, OWNER, amount, OWNER, feeNumerator, { from: SECOND }),
          "Ownable: caller is not the owner"
        );
      });

      it("should revert when edition already exists", async () => {
        await nft.createEdition(editionId, editionInfo, OWNER, amount, OWNER, feeNumerator);

        await truffleAssert.reverts(
          nft.createEdition(editionId, editionInfo, OWNER, amount, OWNER, feeNumerator),
          "EditionContract: edition already exists"
        );
      });
    });

    describe("transferEditionOwnership()", () => {
      beforeEach("create edition", async () => {
        await nft.createEdition(editionId, editionInfo, OWNER, amount, OWNER, feeNumerator);
      });

      it("should move transfer edition ownership", async () => {
        await nft.transferEditionOwnership(editionId, SECOND);

        assert.equal((await nft.editions(editionId)).owner, SECOND);
      });

      it("should revert when try to call from not edition owner", async () => {
        await truffleAssert.reverts(
          nft.transferEditionOwnership(editionId, SECOND, { from: SECOND }),
          "EditionContract: not edition owner"
        );
      });

      it("should revert when try to transfer to zero address", async () => {
        await truffleAssert.reverts(nft.transferEditionOwnership(editionId, ZERO_ADDRESS));
      });
    });

    describe("mint()", () => {
      beforeEach("create edition", async () => {
        await nft.createEdition(editionId, editionInfo, OWNER, amount, OWNER, feeNumerator);
      });

      it("should mint 100 tokens", async () => {
        await nft.mint(SECOND, editionId, 100);

        assert.equal(await nft.balanceOf(SECOND, editionId), 100);
      });

      it("should revert when try to call from not edition owner", async () => {
        await truffleAssert.reverts(
          nft.mint(SECOND, editionId, 100, { from: SECOND }),
          "EditionContract: not edition owner"
        );
      });
    });

    describe("uri()", () => {
      it("should correctly return token uri", async () => {
        await nft.createEdition(editionId, editionInfo, OWNER, amount, OWNER, feeNumerator);

        assert.equal(editionInfo.uri, await nft.uri(editionId));
      });
    });

    describe("disableEdit()", () => {
      beforeEach(async () => {
        await nft.createEdition(editionId, editionInfo, OWNER, amount, OWNER, feeNumerator);
      });

      it("should disable edit", async () => {
        await nft.disableEdit(editionId);

        assert.equal(false, (await nft.editions(editionId)).isEditEnabled);
      });

      it("should revert when try to call from not edition owner", async () => {
        await truffleAssert.reverts(nft.disableEdit(editionId, { from: SECOND }), "EditionContract: not edition owner");
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
        await nft.createEdition(editionId, editionInfo, OWNER, amount, OWNER, feeNumerator);

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
          "EditionContract: not edition owner"
        );
      });

      it("should revert when edit disabled", async () => {
        await nft.createEdition(editionId, editionInfo, OWNER, amount, OWNER, feeNumerator);
        await nft.disableEdit(editionId);
        await truffleAssert.reverts(nft.editEdition(editionId, newInfo), "EditionContract: edit disabled");
      });
    });

    describe("resetRoyalty()", () => {
      const newNumerator = 10 ** 2;

      it("should set new royalty options", async () => {
        await nft.createEdition(editionId, editionInfo, OWNER, amount, OWNER, feeNumerator);
        await nft.resetRoyalty(editionId, SECOND, newNumerator);

        let info = await nft.royaltyInfo(editionId, newNumerator);

        assert.equal(info[0], SECOND);
      });

      it("should revert when edit disabled", async () => {
        await nft.createEdition(editionId, editionInfo, OWNER, amount, OWNER, feeNumerator);
        await nft.disableEdit(editionId);

        await truffleAssert.reverts(
          nft.resetRoyalty(editionId, SECOND, newNumerator),
          "EditionContract: edit disabled"
        );
      });

      it("should revert when try to call from not edition owner", async () => {
        await truffleAssert.reverts(
          nft.resetRoyalty(editionId, SECOND, newNumerator, { from: SECOND }),
          "EditionContract: not edition owner"
        );
      });
    });

    describe("supportsInterface()", () => {
      it("should pass supportsInterface", async () => {
        let idGetter = await InterfaceId.new();

        assert.equal(await nft.supportsInterface(await idGetter.getIEditionContract()), true);
        assert.equal(await nft.supportsInterface(await idGetter.getIERC1155()), true);
        assert.equal(await nft.supportsInterface(await idGetter.getIERC2981()), true);
        assert.equal(await nft.supportsInterface(await idGetter.getIERC165()), true);
      });
    });
  });
});
