// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

interface IERC1155Approval is IERC1155Upgradeable {
    event Approval(address indexed owner, address indexed spender, uint256 id, uint256 value);

    function approve(address to_, uint256 id_, uint256 amount_) external returns (bool);

    function allowance(address from_, address to_, uint256 id_) external view returns (uint256);
}
