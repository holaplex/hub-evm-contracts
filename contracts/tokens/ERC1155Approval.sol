// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";

import "../interfaces/tokens/IERC1155Approval.sol";

contract ERC1155Approval is IERC1155Approval, ERC1155SupplyUpgradeable {
    mapping(bytes32 => uint256) private _allowances;

    function __ERC1155Approval_init(string calldata uri) internal onlyInitializing {
        __ERC1155Supply_init();
        __ERC1155_init(uri);
    }

    function approve(address to_, uint256 id_, uint256 amount_) external override returns (bool) {
        _approve(_msgSender(), to_, id_, amount_);
        return true;
    }

    function allowance(
        address from_,
        address to_,
        uint256 id_
    ) public view override returns (uint256) {
        return _allowances[keccak256(abi.encode(from_, to_, id_))];
    }

    function safeTransferFrom(
        address from_,
        address to_,
        uint256 id_,
        uint256 amount_,
        bytes memory data_
    ) public override(IERC1155Approval, ERC1155Upgradeable) {
        address sender_ = _msgSender();

        if (sender_ != from_ && !isApprovedForAll(from_, sender_)) {
            _spendAllowance(from_, sender_, id_, amount_);
        }

        _safeTransferFrom(from_, to_, id_, amount_, data_);
    }

    function safeBatchTransferFrom(
        address from_,
        address to_,
        uint256[] calldata ids_,
        uint256[] calldata amounts_,
        bytes memory data_
    ) public override(IERC1155Approval, ERC1155Upgradeable) {
        address sender_ = _msgSender();

        if (sender_ != from_ && !isApprovedForAll(from_, sender_)) {
            _batchSpendAllowance(from_, sender_, ids_, amounts_);
        }

        _safeBatchTransferFrom(from_, to_, ids_, amounts_, data_);
    }

    function _approve(address owner_, address spender_, uint256 id_, uint256 amount_) internal {
        require(owner_ != address(0), "ERC1155Approval: approve from the zero address");
        require(spender_ != address(0), "ERC1155Approval: approve to the zero address");
        require(owner_ != spender_, "ERC1155Approval: spender must not be owner");

        _allowances[keccak256(abi.encode(owner_, spender_, id_))] = amount_;
    }

    function _spendAllowance(
        address owner_,
        address spender_,
        uint256 id_,
        uint256 amount_
    ) internal {
        uint256 currentAllowance_ = allowance(owner_, spender_, id_);
        if (currentAllowance_ != type(uint256).max) {
            require(
                allowance(owner_, spender_, id_) >= amount_,
                "ERC1155Approval: insufficient allowance"
            );
            _approve(owner_, spender_, id_, currentAllowance_ - amount_);
        }
    }

    function _batchSpendAllowance(
        address owner_,
        address spender_,
        uint256[] calldata ids_,
        uint256[] calldata amounts_
    ) internal {
        for (uint256 i = 0; i < ids_.length; i++) {
            _spendAllowance(owner_, spender_, ids_[i], amounts_[i]);
        }
    }

    /**
     * This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[45] private __gap;
}
