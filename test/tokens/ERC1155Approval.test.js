const { accounts } = require("../../scripts/utils/utils");
const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");

const ERC1155Approval = artifacts.require("ERC1155ApprovalMock");
const BaseProxy = artifacts.require("BaseProxy");

ERC1155Approval.numberFormat = "BigInt";
BaseProxy.numberFormat = "BigInt";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const uint256Max = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

describe("ERC1155Approval", () => {
  let OWNER;
  let SECOND;
  let erc1155;

  const reverter = new Reverter();

  before("setup", async () => {
    OWNER = await accounts(0);
    SECOND = await accounts(1);

    let _erc1155 = await ERC1155Approval.new();
    let proxy = await BaseProxy.new("0x", _erc1155.address);
    erc1155 = await ERC1155Approval.at(proxy.address);

    await reverter.snapshot();
  });

  afterEach(async () => {
    reverter.revert();
  });

  describe("init", () => {
    it("should init", async () => {
      await truffleAssert.passes(erc1155.__ERC1155ApprovalMock_init("http://"));
    });

    it("should not initialize twice", async () => {
      await erc1155.__ERC1155ApprovalMock_init("http://");
      await truffleAssert.reverts(
        erc1155.__ERC1155ApprovalMock_init("http://"),
        "Initializable: contract is already initialized"
      );
    });
  });

  describe("initialized contract", () => {
    beforeEach("init and mint", async () => {
      await erc1155.__ERC1155ApprovalMock_init("http://");
      await erc1155.mint(OWNER, 1, 1000);
      await erc1155.mint(OWNER, 2, 1000);
    });

    describe("approve()", () => {
      it("should approve tokens with different ids", async () => {
        await erc1155.approve(SECOND, 1, 100);
        await erc1155.approve(SECOND, 2, 500);

        assert.equal(await erc1155.allowance(OWNER, SECOND, 1), 100);
        assert.equal(await erc1155.allowance(OWNER, SECOND, 2), 500);
      });

      it("should reset approve", async () => {
        await erc1155.approve(SECOND, 1, 100);
        assert.equal(await erc1155.allowance(OWNER, SECOND, 1), 100);

        await erc1155.approve(SECOND, 1, 200);
        assert.equal(await erc1155.allowance(OWNER, SECOND, 1), 200);
      });

      it("should not approve to zero address", async () => {
        await truffleAssert.reverts(
          erc1155.mockedApprove(OWNER, ZERO_ADDRESS, 1, 100),
          "ERC1155Approval: approve to the zero address"
        );
      });

      it("should not approve from zero address", async () => {
        await truffleAssert.reverts(
          erc1155.mockedApprove(ZERO_ADDRESS, OWNER, 1, 100),
          "ERC1155Approval: approve from the zero address"
        );
      });

      it("should not approve when from == to", async () => {
        await truffleAssert.reverts(
          erc1155.mockedApprove(OWNER, OWNER, 1, 100),
          "ERC1155Approval: spender must not be owner"
        );
      });
    });

    describe("safeTransferFrom()", () => {
      it("should transfer from tokens with different ids", async () => {
        await erc1155.safeTransferFrom(OWNER, SECOND, 1, 50, "0x");
        await erc1155.safeTransferFrom(OWNER, SECOND, 2, 300, "0x");

        assert.equal(await erc1155.balanceOf(SECOND, 1), 50);
        assert.equal(await erc1155.balanceOf(SECOND, 2), 300);
      });

      it("should transfer from tokens when caller != from", async () => {
        await erc1155.approve(SECOND, 1, 100);
        await erc1155.approve(SECOND, 2, 300);

        await erc1155.safeTransferFrom(OWNER, SECOND, 1, 50, "0x", { from: SECOND });
        await erc1155.safeTransferFrom(OWNER, SECOND, 2, 300, "0x", { from: SECOND });

        assert.equal(await erc1155.balanceOf(SECOND, 1), 50);
        assert.equal(await erc1155.balanceOf(SECOND, 2), 300);

        assert.equal(await erc1155.allowance(OWNER, SECOND, 1), 50);
        assert.equal(await erc1155.allowance(OWNER, SECOND, 2), 0);
      });

      it("should transfer when approved for all", async () => {
        await erc1155.setApprovalForAll(SECOND, true);

        await erc1155.safeTransferFrom(OWNER, SECOND, 1, 50, "0x", { from: SECOND });
        await erc1155.safeTransferFrom(OWNER, SECOND, 2, 300, "0x", { from: SECOND });

        assert.equal(await erc1155.balanceOf(SECOND, 1), 50);
        assert.equal(await erc1155.balanceOf(SECOND, 2), 300);
      });

      it("should not spend allowance when allowance is uint256.max", async () => {
        await erc1155.approve(SECOND, 1, uint256Max);

        await erc1155.safeTransferFrom(OWNER, SECOND, 1, 50, "0x", { from: SECOND });

        assert.equal(await erc1155.balanceOf(SECOND, 1), 50);

        assert.equal(await erc1155.allowance(OWNER, SECOND, 1), uint256Max);
      });

      it("should revert when not approved", async () => {
        await truffleAssert.reverts(
          erc1155.safeTransferFrom(OWNER, SECOND, 1, 50, "0x", { from: SECOND }),
          "ERC1155Approval: insufficient allowance"
        );
      });
    });

    describe("safeBatchTransferFrom()", () => {
      it("should transfer from tokens with different ids", async () => {
        await erc1155.safeBatchTransferFrom(OWNER, SECOND, [1, 2], [50, 300], "0x");

        assert.equal(await erc1155.balanceOf(SECOND, 1), 50);
        assert.equal(await erc1155.balanceOf(SECOND, 2), 300);
      });

      it("should transfer from tokens when caller != from", async () => {
        await erc1155.approve(SECOND, 1, 100);
        await erc1155.approve(SECOND, 2, 300);

        await erc1155.safeBatchTransferFrom(OWNER, SECOND, [1, 2], [50, 300], "0x", { from: SECOND });

        assert.equal(await erc1155.balanceOf(SECOND, 1), 50);
        assert.equal(await erc1155.balanceOf(SECOND, 2), 300);

        assert.equal(await erc1155.allowance(OWNER, SECOND, 1), 50);
        assert.equal(await erc1155.allowance(OWNER, SECOND, 2), 0);
      });

      it("should transfer when approved for all", async () => {
        await erc1155.setApprovalForAll(SECOND, true);

        await erc1155.safeBatchTransferFrom(OWNER, SECOND, [1, 2], [50, 300], "0x", { from: SECOND });

        assert.equal(await erc1155.balanceOf(SECOND, 1), 50);
        assert.equal(await erc1155.balanceOf(SECOND, 2), 300);
      });

      it("should revert when not approved", async () => {
        await truffleAssert.reverts(
          erc1155.safeBatchTransferFrom(OWNER, SECOND, [1, 2], [50, 300], "0x", { from: SECOND }),
          "ERC1155Approval: insufficient allowance"
        );
      });
    });
  });
});
