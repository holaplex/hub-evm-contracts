// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../proxy/UUPSOwnable.sol";

contract UUPSOwnableMock is UUPSOwnable {
    function __UUPSOwnableMock_init() external initializer {
        __UUPSOwnable_init();
    }

    function __UUPSOwnableMock_init_fails() external {
        __UUPSOwnable_init();
    }

    function authorizeUpgrade() external view {
        _authorizeUpgrade(msg.sender);
    }
}
