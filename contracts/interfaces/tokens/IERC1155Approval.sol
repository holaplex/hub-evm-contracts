// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

interface IERC1155Approval is IERC1155Upgradeable {
    event Approval(address indexed owner, address indexed spender, uint256 id, uint256 value);

    /**
     * @notice The function for setting allowance from sender
     * @param to_ the address of target for approve
     * @param id_ the id of token
     * @param amount_ the amount of allowance
     * @return `true` if the allowance is set correctly
     */
    function approve(address to_, uint256 id_, uint256 amount_) external returns (bool);

    /**
     * @notice The fucntion for getting allowance amount
     * @param from_ the address of approval addressee
     * @param to_ the address of approval destination
     * @param id_ the id of token
     * @return `amount` of allowance
     */
    function allowance(address from_, address to_, uint256 id_) external view returns (uint256);
}
