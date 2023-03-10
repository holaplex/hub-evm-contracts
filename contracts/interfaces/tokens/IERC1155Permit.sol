// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

interface IERC1155Permit {
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

    function nonces(address owner_) external view returns (uint256);

    function DOMAIN_SEPARATOR() external view returns (bytes32);
}
