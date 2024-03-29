// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../tokens/ERC1155Approval.sol";

contract ERC1155ApprovalMock is ERC1155Approval {
    function __ERC1155ApprovalMock_init(string calldata url_) external initializer {
        __ERC1155Approval_init(url_);
    }

    function __ERC1155ApprovalMock_init_fails(string calldata url_) external {
        __ERC1155Approval_init(url_);
    }

    function mint(address to_, uint256 id_, uint256 amount_) external {
        _mint(to_, id_, amount_, "");
    }

    function mockedApprove(
        address owner_,
        address spender_,
        uint256 id_,
        uint256 amount_
    ) external {
        _approve(owner_, spender_, id_, amount_);
    }
}
