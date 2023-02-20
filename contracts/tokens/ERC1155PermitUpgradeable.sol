// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./ERC1155Approval.sol";

import "../interfaces/tokens/IERC1155PermitUpgradeable.sol";


abstract contract ERC1155PermitUpgradeable is ERC1155Approval, EIP712Upgradeable, IERC1155PermitUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    mapping(address => CountersUpgradeable.Counter) private _nonces;
     
    bytes32 private _PERMIT_TYPEHASH;

    function __ERC1155PermitUpgradeable_init(string calldata uri) internal onlyInitializing {
        __EIP712_init("", "1");
        __ERC1155Approval_init(uri);
        __ERC1155PermitUpgradeable_init_unchained();
    }

    function __ERC1155PermitUpgradeable_init_unchained() internal onlyInitializing {
        _PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 id,uint256 value,uint256 nonce,uint256 deadline)");
    }

    function permit(
        address owner,
        address spender,
        uint256 id,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        require(block.timestamp <= deadline, "ERC1155Permit: expired deadline");

        bytes32 structHash = keccak256(abi.encode(_PERMIT_TYPEHASH, owner, spender, id, value, _useNonce(owner), deadline));

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSAUpgradeable.recover(hash, v, r, s);
        require(signer == owner, "ERC1155Permit: invalid signature");

        _approve(owner, spender, id, value);
    }

    function nonces(address owner) external view override returns (uint256) {
        return _nonces[owner].current();
    }

    function DOMAIN_SEPARATOR() external view override   returns (bytes32) {
        return _domainSeparatorV4();
    }

    function _useNonce(address owner) internal virtual returns (uint256 current) {
        CountersUpgradeable.Counter storage nonce = _nonces[owner];
        current = nonce.current();
        nonce.increment();
    }

}
