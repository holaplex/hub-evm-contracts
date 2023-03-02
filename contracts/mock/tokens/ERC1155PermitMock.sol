// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "../../tokens/ERC1155Permit.sol";

contract ERC1155PermitMock is ERC1155Permit {
    function __ERC1155PermitMock_init(string calldata url_) external initializer {
        __ERC1155PermitUpgradeable_init(url_);
    }

}