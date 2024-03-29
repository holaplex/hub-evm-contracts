// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../tokens/ERC1155Permit.sol";

contract ERC1155PermitMock is ERC1155Permit {
    function __ERC1155PermitMock_init(string calldata url_) external initializer {
        __ERC1155PermitUpgradeable_init(url_);
    }

    function __ERC1155PermitMock_init_fails(string calldata url_) external {
        __ERC1155PermitUpgradeable_init(url_);
    }

    function __ERC1155PermitUpgradeable_init_unchained_fails() external {
        __ERC1155PermitUpgradeable_init_unchained();
    }
}
