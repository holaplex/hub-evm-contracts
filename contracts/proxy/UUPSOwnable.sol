// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "../interfaces/proxy/IUUPSOwnable.sol";

abstract contract UUPSOwnable is OwnableUpgradeable, UUPSUpgradeable, IUUPSOwnable {
    bool public isNotUpgradeable;

    function __UUPSOwnable_init() internal onlyInitializing {
        __ERC1967Upgrade_init();
        __UUPSUpgradeable_init();
        __Ownable_init();
    }

    function removeUpgradeability() external override onlyOwner {
        isNotUpgradeable = true;
    }

    function _authorizeUpgrade(address) internal view override onlyOwner {
        require(!isNotUpgradeable, "UUPSOwnable: upgrade isn't available");
    }
}
