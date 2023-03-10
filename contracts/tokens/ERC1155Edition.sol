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

    function supportsInterface(
        bytes4 interfaceId_
    )
        public
        view
        override(IERC1155Edition, IERC165Upgradeable, ERC2981Upgradeable)
        returns (bool)
    {
        return
            ERC1155Upgradeable.supportsInterface(interfaceId_) ||
            ERC2981Upgradeable.supportsInterface(interfaceId_) ||
            interfaceId_ == type(IERC1155Edition).interfaceId;
    }

    function uri(uint256 id_) public view override returns (string memory) {
        return editions[id_].info.uri;
    }

    function createEdition(
        uint256 id_,
        Edition memory edition_,
        uint256 toMintAmount_,
        uint96 feeNumerator_
    ) external override onlyOwner {
        require(editions[id_].owner == address(0), "ERC1155Edition: edition already exists");

        edition_.owner = _msgSender();
        edition_.createdAt = uint128(block.timestamp);

        editions[id_] = edition_;

        _mint(_msgSender(), id_, toMintAmount_, "");
        _setTokenRoyalty(id_, _msgSender(), feeNumerator_);
    }

    function disableEdit(uint256 id_) external override onlyEditionOwner(id_) {
        editions[id_].isEditEnabled = false;
    }

    function editEdition(
        uint256 id_,
        EditionInfo calldata info_
    ) external override onlyEditionOwner(id_) {
        require(editions[id_].isEditEnabled, "ERC1155Edition: edit disabled");
        editions[id_].info = info_;
    }

    function resetRoyalty(
        uint256 id_,
        address receiver_,
        uint96 feeNumerator_
    ) external override onlyEditionOwner(id_) {
        require(editions[id_].isEditEnabled, "ERC1155Edition: edit disabled");
        _resetTokenRoyalty(id_);
        _setTokenRoyalty(id_, receiver_, feeNumerator_);
    }

    function transferEditionOwnership(
        uint256 id_,
        address to_
    ) public override onlyEditionOwner(id_) {
        require(to_ != address(0), "ERC1155Edition: zero address");
        editions[id_].owner = to_;
    }

    function mint(
        address to_,
        uint256 id_,
        uint256 amount_
    ) external override onlyEditionOwner(id_) {
        _mint(to_, id_, amount_, "");
    }

    /**
     * This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[45] private __gap;
}
