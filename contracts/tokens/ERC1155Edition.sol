// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";

import "./ERC1155Permit.sol";
import "../proxy/UUPSOwnable.sol";

import "../interfaces/tokens/IERC1155Edition.sol";

contract ERC1155Edition is ERC2981Upgradeable, ERC1155Permit, UUPSOwnable, IERC1155Edition {
    
    mapping(uint256 => Edition) public editions;

    modifier onlyEditionOwner(uint256 editionId_) {
        require(_msgSender() == editions[editionId_].owner, "ERC1155Edition: not edititon owner");
        _;
    }
    
    function __ERC1155Edition_init(string calldata uri_) external initializer {
        __UUPSOwnable_init();
        __ERC1155PermitUpgradeable_init(uri_);
        __ERC2981_init();
    }

    function supportsInterface(bytes4 interfaceId_) public view override(IERC1155Edition, IERC165Upgradeable, ERC2981Upgradeable) returns (bool) {
        return ERC1155Upgradeable.supportsInterface(interfaceId_) || ERC2981Upgradeable.supportsInterface(interfaceId_) || interfaceId_ == type(IERC1155Edition).interfaceId;
    }

    function uri(uint256 id_) public override view returns (string memory) {
        return editions[id_].info.uri;
    }

    function createNewEdition(uint256 id_, Edition memory edition_) external override onlyOwner {
        require(editions[id_].owner == address(0), "ERC1155Edition: edition already exists");

        edition_.owner = address(this);
        edition_.createdAt = block.timestamp;

        editions[id_] = edition_;       
    }

    function disableEdit(uint256 id_) external override onlyEditionOwner(id_) {
        require(editions[id_].isEditEnabled, "ERC1155Edition: edit disabled");
        editions[id_].isEditEnabled = false;
    }

    function editEdition(uint256 id_, ChangeableInfo calldata info_) external override onlyEditionOwner(id_) {
        require(editions[id_].isEditEnabled, "ERC1155Edition: edit disabled");
        editions[id_].info = info_;
    }

    function transferEditionOwnership(uint256 id_, address to_) public override onlyEditionOwner(id_) {
        require(to_ != address(0), "ERC1155Edition: zero address");
        editions[id_].owner = to_;
    }

    function mint(address to_, uint256 id_, uint256 amount_) external override onlyEditionOwner(id_) {
        _mint(to_, id_, amount_, "");
    }
}