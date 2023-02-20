const { toBN, accounts, wei } = require("../../scripts/utils/utils");
const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { artifacts } = require("hardhat");

const HolaplexNFT = artifacts.require("HolaplexNFT");
const BaseProxy = artifacts.require("BaseProxy");

HolaplexNFT.numberFormat = "BigInt";
BaseProxy.numberFormat   = "BigInt";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe.only("HolaplexNFT", () => {
    let OWNER;
    let SECOND;
    let nft;
    
    const reverter = new Reverter();

    before("setup", async () => {
        OWNER = await accounts(0);
        SECOND = await accounts(1);

        let _holaplexNFT = await HolaplexNFT.new();
        let proxy = await BaseProxy.new("0x", _holaplexNFT.address);
        nft = await HolaplexNFT.at(proxy.address);

        await reverter.snapshot();
    });
    
    afterEach(async () => {reverter.revert()});

    describe("init", () => {
        it("should init", async () => {
            await truffleAssert.passes(nft.__HolaplexNFT_init("http://"));
        });

        it("should not initialize twice", async () => {
            await nft.__HolaplexNFT_init("http://");
            await truffleAssert.reverts(nft.__HolaplexNFT_init("http://"), "Initializable: contract is already initialized");
        });
    });

    describe("initialized contract", () => {
        const editionId = 123;
        const editionInfo = {
            description: "description",
            imageUri:    "/uri/1",
            creator:     "0x76e98f7d84603AEb97cd1c89A80A9e914f181679",
            createdAt:   0,
            collection:  "Collection"
        };

        beforeEach("init and mint", async () => {
            await nft.__HolaplexNFT_init("http://");
        });

        describe("createNewEdition()", () => {
            it("should create a new edition with the correct metadata", async () => {
                await nft.createNewEdition(editionId, editionInfo);

                let editionInfoContract = await nft.editionInfo(editionId);

                assert.equal(editionInfoContract.description, editionInfo.description);
                assert.equal(editionInfoContract.imageUri, editionInfo.imageUri);
                assert.equal(editionInfoContract.creator, editionInfo.creator);
                assert.equal(editionInfoContract.createdAt, editionInfo.createdAt);
                assert.equal(editionInfoContract.collection, editionInfo.collection);

                assert.equal(await nft.editionToOwner(editionId), OWNER);
            });

            it("should revert when caller is not owner", async () => {
                await truffleAssert.reverts(
                    nft.createNewEdition(editionId, editionInfo, { from: SECOND }),
                    "Ownable: caller is not the owner"
                  );
            });

            it("should revert when edition already exists", async () => {
                await nft.createNewEdition(editionId, editionInfo);

                await truffleAssert.reverts(
                    nft.createNewEdition(editionId, editionInfo),
                    "HNFT: edition already exists"
                  );
            });
        });

        describe("moveEditionOwnership()", () => {
            beforeEach("create edition", async () => {
                await nft.createNewEdition(editionId, editionInfo);
            });

            it("should move transfer edition ownership", async () => {
                await nft.moveEditionOwnership(editionId, SECOND);

                assert.equal(await nft.editionToOwner(editionId), SECOND);
            });

            it("should revert when try to call from not edition owner", async () => {
                await truffleAssert.reverts(nft.moveEditionOwnership(editionId, SECOND, {from:SECOND}), "HNFT: not edititon owner");
            });

            it("should revert when try to transfer to zero address", async () => {
                await truffleAssert.reverts(nft.moveEditionOwnership(editionId, ZERO_ADDRESS));
            })
        });

        describe("mint()", () => {
            beforeEach("create edition", async () => {
                await nft.createNewEdition(editionId, editionInfo);
            });

            it("should mint 100 tokens", async () => {
                await nft.mint(SECOND, editionId, 100);

                assert.equal(await nft.balanceOf(SECOND, editionId), 100);
            });

            it("should revert when try to call from not edition owner", async () => {
                await truffleAssert.reverts(nft.mint(SECOND, editionId, 100, {from:SECOND}), "HNFT: not edititon owner");
            });
        });
    });

});