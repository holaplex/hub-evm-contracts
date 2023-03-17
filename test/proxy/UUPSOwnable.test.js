const { artifacts, web3 } = require("hardhat");

const UUPSOwnable = artifacts.require("UUPSOwnableMock");
const BaseProxy = artifacts.require("BaseProxy");
const truffleAssert = require("truffle-assertions");
const Reverter = require("../helpers/reverter");

const { accounts } = require("../../scripts/utils/utils");
const { assert } = require("chai");
const { encodeCall } = require("../../scripts/utils/callEncoder");

describe("UUPSOwnable", async () => {
  let uupsOwnable;
  let OWNER;
  let SECOND;

  const reverter = new Reverter();

  before("setup", async () => {
    OWNER = await accounts(0);
    SECOND = await accounts(1);

    let _uupsOwnable = await UUPSOwnable.new();
    let proxy = await BaseProxy.new(encodeCall(web3, _uupsOwnable, "__UUPSOwnableMock_init", []), _uupsOwnable.address);
    uupsOwnable = await UUPSOwnable.at(proxy.address);

    await reverter.snapshot();
  });

  afterEach(async () => {
    reverter.revert();
  });

  describe("init", () => {
    it("should init", async () => {
      let _uupsOwnable = await UUPSOwnable.new();
      let proxy = await BaseProxy.new("0x", _uupsOwnable.address);
      let newContract = await UUPSOwnable.at(proxy.address);

      await truffleAssert.passes(newContract.__UUPSOwnableMock_init());
    });

    it("should not initialize twice", async () => {
      await truffleAssert.reverts(
        uupsOwnable.__UUPSOwnableMock_init(),
        "Initializable: contract is already initialized"
      );
    });

    it("should fail in onlyInitializing", async () => {
      await truffleAssert.reverts(
        uupsOwnable.__UUPSOwnableMock_init_fails(),
        "Initializable: contract is not initializing"
      );
    });
  });

  describe("removeUpgradeability()", () => {
    it("should remove upgreadability", async () => {
      assert.equal(await uupsOwnable.isNotUpgradeable(), false);

      await uupsOwnable.removeUpgradeability();

      assert.equal(await uupsOwnable.isNotUpgradeable(), true);
    });

    it("should revert calls not owner", async () => {
      await truffleAssert.reverts(
        uupsOwnable.removeUpgradeability({ from: SECOND }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("authorizeUpgrade()", () => {
    it("should pass if isNotUpgradeable is false, and fails if true", async () => {
      await truffleAssert.passes(uupsOwnable.authorizeUpgrade());

      await uupsOwnable.removeUpgradeability();

      await truffleAssert.reverts(uupsOwnable.authorizeUpgrade(), "UUPSOwnable: upgrade isn't available");
    });

    it("should revert calls not owner", async () => {
      await truffleAssert.reverts(uupsOwnable.authorizeUpgrade({ from: SECOND }), "Ownable: caller is not the owner");
    });
  });
});

// npx hardhat coverage --testfiles "test/extensions/UUPSOwnable.test.js"
