// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IERC1155Approval.sol";

interface IERC1155Permit is IERC1155Approval {
    /**
     * @notice The function calls approve with given parameters
     * @param owner_ the address of approval addressee
     * @param spender_ the address of approval destination
     * @param id_ the id of token
     * @param value_ the amount of allowance
     * @param deadline_ the timestamp up to which permit can be used
     * @param v_ the part of owner's signature
     * @param r_ the part of owner's signature
     * @param s_ the part of owner's signature
     */
    function permit(
        address owner_,
        address spender_,
        uint256 id_,
        uint256 value_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external;

    /**
     * @notice The function for gettin nonce of address at current contract
     * @param owner_ the destination address for getting nonce
     * @return `nonce` of address at current contract
     */
    function nonces(address owner_) external view returns (uint256);

    /**
     * @notice The function for getting domain separator, according to EIP-712
     * @return `keccak256(abi.encode(_TYPE_HASH,  _EIP712NameHash(),  _EIP712VersionHash(), block.chainid, address(this)));`
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}
