// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";

contract ERC1155Approval is ERC1155SupplyUpgradeable {
    
    mapping(address => mapping(bytes32 => uint256)) private _allowance;
   
    function __ERC1155Approval_init(string calldata uri) internal onlyInitializing {
        __ERC1155_init(uri);
    }

    function approve(address to, uint256 id, uint256 amount) external returns (bool) {
        _approve(msg.sender, to, id, amount);
        return true;
    }

    function allowance(address from, address to, uint256 id) public view returns(uint256) {
        return _allowance[from][keccak256(abi.encode(to,id))];
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()) || allowance(from, to, id) >= amount,
            "ERC1155Approval: transfer caller is not owner nor approved"
        );

        _safeTransferFrom(from, to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()) || _batchApproveCheck(from,to,ids,amounts),
            "ERC1155Approval: transfer caller is not owner nor approved"
        );

        _safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    function _approve(
        address owner,
        address spender,
        uint256 id,
        uint256 amount
    ) internal virtual {
        require(owner != address(0), "ERC1155Approval: approve from the zero address");
        require(spender != address(0), "ERC1155Approval: approve to the zero address");

        _allowance[owner][keccak256(abi.encode(spender, id))] = amount;
    }

    function _batchApproveCheck(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal view returns(bool checked) {
        for (uint i = 0; i < ids.length; i++) {
            if (checked = allowance(from, to, ids[i]) >= amounts[i]){
                break;
            }
        }
    }
}