// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";

import "../proxy/IUUPSOwnable.sol";
import "./IERC1155PermitUpgradeable.sol";

interface IHolaplexNFT is IERC2981Upgradeable, IERC1155PermitUpgradeable, IUUPSOwnable {
    struct EditionInfo {
        string description;
        string imageUri;
        address creator;
        uint256 createdAt;
        string collection;
    }

    function __HolaplexNFT_init(string calldata uri) external;

    function supportsInterface(bytes4 interfaceId) external view returns (bool);
    
    function createNewEdition(uint256 id, EditionInfo calldata info) external;

    function moveEditionOwnership(uint256 id, address to) external;

    function mint(address to, uint256 id, uint256 amount) external; 
}