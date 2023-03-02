// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./ERC1155Approval.sol";

import "../interfaces/tokens/IERC1155Permit.sol";

import "hardhat/console.sol";

abstract contract ERC1155Permit is ERC1155Approval, EIP712Upgradeable, IERC1155Permit {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    mapping(address => CountersUpgradeable.Counter) private _nonces;
     
    bytes32 private _PERMIT_TYPEHASH;

    function __ERC1155PermitUpgradeable_init(string calldata uri_) internal onlyInitializing {
        __EIP712_init("ERC1155Permit", "1");
        __ERC1155Approval_init(uri_);
        __ERC1155PermitUpgradeable_init_unchained();
    }

    function __ERC1155PermitUpgradeable_init_unchained() internal onlyInitializing {
        _PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 id,uint256 value,uint256 nonce,uint256 deadline)");
    }

    function getPermitTypeHash() external view returns(bytes32) {
        return _PERMIT_TYPEHASH;
    }

    function getHashTypedDataV4(
        address owner_,
        address spender_,
        uint256 id_,
        uint256 value_,
        uint256 deadline_
    ) external view returns (bytes32) {
        bytes32 structHash = keccak256(abi.encode(_PERMIT_TYPEHASH, owner_, spender_, id_, value_, _nonces[owner_].current(), deadline_));
        

        return _hashTypedDataV4(structHash);
    }

    function permit(
        address owner_,
        address spender_,
        uint256 id_,
        uint256 value_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external override {
        require(block.timestamp <= deadline_, "ERC1155Permit: expired deadline");

        bytes32 structHash = keccak256(abi.encode(_PERMIT_TYPEHASH, owner_, spender_, id_, value_, _useNonce(owner_), deadline_));

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSAUpgradeable.recover(hash, v_, r_, s_);
        
        require(signer == owner_, "ERC1155Permit: invalid signature");

        _approve(owner_, spender_, id_, value_);
    }

    function nonces(address owner_) external view override returns (uint256) {
        return _nonces[owner_].current();
    }

    function DOMAIN_SEPARATOR() external view override   returns (bytes32) {
        return _domainSeparatorV4();
    }

    function _useNonce(address owner_) internal virtual returns (uint256 current) {
        CountersUpgradeable.Counter storage _nonce = _nonces[owner_];
        current = _nonce.current();
        _nonce.increment();
    }
}
