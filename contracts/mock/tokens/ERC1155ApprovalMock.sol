// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../tokens/ERC1155Approval.sol";

contract ERC1155ApprovalMock is ERC1155Approval {
    function __ERC1155ApprovalMock_init(string calldata url) external initializer {
        __ERC1155Approval_init(url);
    }

    function mint(address to, uint256 id, uint256 amount) external {
        _mint(to, id, amount, "");
    }
}