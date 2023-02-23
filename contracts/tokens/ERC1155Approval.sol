// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";

contract ERC1155Approval is ERC1155SupplyUpgradeable {
    
    mapping(address => mapping(bytes32 => uint256)) private _allowances;
   
    function __ERC1155Approval_init(string calldata uri) internal onlyInitializing {
        __ERC1155_init(uri);
    }

    function approve(address to_, uint256 id_, uint256 amount_) external returns (bool) {
        _approve(_msgSender(), to_, id_, amount_);
        return true;
    }

    function allowance(address from_, address to_, uint256 id_) public view returns(uint256) {
        return _allowances[from_][keccak256(abi.encode(to_, id_))];
    }

    function safeTransferFrom(
        address from_,
        address to_,
        uint256 id_,
        uint256 amount_,
        bytes memory data_
    ) public override {
        require(
            from_ == _msgSender() || isApprovedForAll(from_, _msgSender()) || allowance(from_, to_, id_) >= amount_,
            "ERC1155Approval: caller is not owner not approved"
        );

        _safeTransferFrom(from_, to_, id_, amount_, data_);
    }

    function safeBatchTransferFrom(
        address from_,
        address to_,
        uint256[] memory ids_,
        uint256[] memory amounts_,
        bytes memory data_
    ) public override {
        require(
            from_ == _msgSender() || isApprovedForAll(from_, _msgSender()) || _batchApproveCheck(from_, to_, ids_, amounts_),
            "ERC1155Approval: transfer caller is not owner not approved"
        );

        _safeBatchTransferFrom(from_, to_, ids_, amounts_, data_);
    }

    function _approve(
        address owner_,
        address spender_,
        uint256 id_,
        uint256 amount_
    ) internal virtual {
        require(owner_ != address(0), "ERC1155Approval: approve from the zero address");
        require(spender_ != address(0), "ERC1155Approval: approve to the zero address");

        _allowances[owner_][keccak256(abi.encode(spender_, id_))] = amount_;
    }

    function _batchApproveCheck(
        address from_,
        address to_,
        uint256[] memory ids_,
        uint256[] memory amounts_
    ) internal view returns(bool checked) {
        for (uint256 i = 0; i < ids_.length; i++) {
            checked = allowance(from_, to_, ids_[i]) >= amounts_[i];
            if (!checked) break;
        }
    }
}