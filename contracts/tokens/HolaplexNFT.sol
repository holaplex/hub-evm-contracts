// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";

import "./ERC1155PermitUpgradeable.sol";
import "../proxy/UUPSOwnable.sol";

import "../interfaces/tokens/IHolaplexNFT.sol";

contract HolaplexNFT is ERC2981Upgradeable, ERC1155PermitUpgradeable, UUPSOwnable, IHolaplexNFT {
    
    mapping(uint256 => address) public editionToOwner;

    mapping(uint256 => EditionInfo) public editionInfo;

    modifier onlyEditionOwner(uint256 editionId) {
        require(msg.sender == editionToOwner[editionId] || editionToOwner[editionId] == address(0), "HNFT: not edititon owner");
        _;
    }
    
    function __HolaplexNFT_init(string calldata uri) external initializer {
        __UUPSOwnable_init();
        __ERC1155PermitUpgradeable_init(uri);
        __ERC2981_init();
    }

    function supportsInterface(bytes4 interfaceId) public view override(IHolaplexNFT, ERC1155Upgradeable, ERC2981Upgradeable) returns (bool) {
        return ERC1155Upgradeable.supportsInterface(interfaceId) || ERC2981Upgradeable.supportsInterface(interfaceId);
    }

    function createNewEdition(uint256 id, EditionInfo calldata info) external override onlyOwner {
        require(editionToOwner[id] == address(0), "HNFT: edition already exists");

        editionInfo[id] = info;
        moveEditionOwnership(id, owner());
    }

    function moveEditionOwnership(uint256 id, address to) public override onlyEditionOwner(id) {
        require(to != address(0), "HNFT: zero address");
        editionToOwner[id] = to;       
    }

    function mint(address to, uint256 id, uint256 amount) external override onlyEditionOwner(id) {
        _mint(to, id, amount, "");
    }


}