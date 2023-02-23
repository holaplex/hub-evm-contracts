// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";

import "./ERC1155Permit.sol";
import "../proxy/UUPSOwnable.sol";

import "../interfaces/tokens/IERC1155Edition.sol";

contract ERC1155Edition is ERC2981Upgradeable, ERC1155Permit, UUPSOwnable, IERC1155Edition {
    
    mapping(uint256 => address) public editionToOwner;

    mapping(uint256 => Edition) public editionInfo;

    modifier onlyEditionOwner(uint256 editionId_) {
        require(_msgSender() == editionToOwner[editionId_] || editionToOwner[editionId_] == address(0), "HNFT: not edititon owner");
        _;
    }
    
    function __ERC1155Edition_init(string calldata uri_) external initializer {
        __UUPSOwnable_init();
        __ERC1155PermitUpgradeable_init(uri_);
        __ERC2981_init();
    }

    function supportsInterface(bytes4 interfaceId_) public view override(IERC1155Edition, ERC1155Upgradeable, ERC2981Upgradeable) returns (bool) {
        return ERC1155Upgradeable.supportsInterface(interfaceId_) || ERC2981Upgradeable.supportsInterface(interfaceId_);
    }

    function createNewEdition(uint256 id_, Edition calldata info_) external override onlyOwner {
        require(editionToOwner[id_] == address(0), "HNFT: edition already exists");

        editionInfo[id_] = info_;
        transferEditionOwnership(id_, owner());
    }

    function transferEditionOwnership(uint256 id_, address to_) public override onlyEditionOwner(id_) {
        require(to_ != address(0), "HNFT: zero address");
        editionToOwner[id_] = to_;
    }

    function mint(address to_, uint256 id_, uint256 amount_) external override onlyEditionOwner(id_) {
        _mint(to_, id_, amount_, "");
    }


}