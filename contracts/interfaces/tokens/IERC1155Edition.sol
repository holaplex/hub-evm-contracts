// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";

import "../proxy/IUUPSOwnable.sol";
import "./IERC1155Permit.sol";

interface IERC1155Edition is IERC2981Upgradeable, IERC1155Permit, IUUPSOwnable {
    struct Edition {
        string description;
        string imageUri;
        address creator;
        uint256 createdAt;
        string collection;
    }

    function __ERC1155Edition_init(string calldata uri_) external;

    function supportsInterface(bytes4 interfaceId_) external view returns (bool);
    
    function createNewEdition(uint256 id_, Edition calldata info_) external;

    function transferEditionOwnership(uint256 id_, address to_) external;

    function mint(address to_, uint256 id_, uint256 amount_) external; 
}