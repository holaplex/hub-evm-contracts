// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "../../tokens/ERC1155Approval.sol";

contract ERC1155ApprovalMock is ERC1155Approval {
    function __ERC1155ApprovalMock_init(string calldata url_) external initializer {
        __ERC1155Approval_init(url_);
    }

    function mint(address to_, uint256 id_, uint256 amount_) external {
        _mint(to_, id_, amount_, "");
    }
}