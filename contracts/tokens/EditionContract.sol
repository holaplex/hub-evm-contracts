// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";

import "./ERC1155Permit.sol";
import "../proxy/UUPSOwnable.sol";

import "../interfaces/tokens/IEditionContract.sol";

contract EditionContract is ERC2981Upgradeable, ERC1155Permit, UUPSOwnable, IEditionContract {
    mapping(uint256 => Edition) public editions;

    modifier onlyEditionOwner(uint256 editionId_) {
        require(_msgSender() == editions[editionId_].owner, "EditionContract: not edititon owner");
        _;
    }

    function __EditionContract_init(string calldata uri_) external initializer {
        __UUPSOwnable_init();
        __ERC1155PermitUpgradeable_init(uri_);
        __ERC2981_init();
    }

    function supportsInterface(
        bytes4 interfaceId_
    )
        public
        view
        override(IEditionContract, IERC165Upgradeable, ERC2981Upgradeable)
        returns (bool)
    {
        return
            ERC1155Upgradeable.supportsInterface(interfaceId_) ||
            ERC2981Upgradeable.supportsInterface(interfaceId_) ||
            interfaceId_ == type(IEditionContract).interfaceId;
    }

    function uri(uint256 id_) public view override returns (string memory) {
        return editions[id_].info.uri;
    }

    function ownerOf(uint256 id_) external view override returns (address) {
        return editions[id_].owner;
    }

    function createEdition(
        uint256 id_,
        EditionInfo memory editionInfo_,
        address tokenReceiver,
        uint256 toMintAmount_,
        address feeReceiver_,
        uint96 feeNumerator_
    ) external override onlyOwner {
        require(editions[id_].owner == address(0), "EditionContract: edition already exists");

        editions[id_] = Edition({
            owner: _msgSender(),
            createdAt: uint128(block.timestamp),
            isEditEnabled: true,
            info: editionInfo_
        });

        _mint(tokenReceiver, id_, toMintAmount_, "");
        _setTokenRoyalty(id_, feeReceiver_, feeNumerator_);
    }

    function disableEdit(uint256 id_) external override onlyEditionOwner(id_) {
        editions[id_].isEditEnabled = false;
    }

    function editEdition(
        uint256 id_,
        EditionInfo calldata info_
    ) external override onlyEditionOwner(id_) {
        require(editions[id_].isEditEnabled, "EditionContract: edit disabled");
        editions[id_].info = info_;
    }

    function resetRoyalty(
        uint256 id_,
        address receiver_,
        uint96 feeNumerator_
    ) external override onlyEditionOwner(id_) {
        require(editions[id_].isEditEnabled, "EditionContract: edit disabled");
        _resetTokenRoyalty(id_);
        _setTokenRoyalty(id_, receiver_, feeNumerator_);
    }

    function transferEditionOwnership(
        uint256 id_,
        address to_
    ) public override onlyEditionOwner(id_) {
        require(to_ != address(0), "EditionContract: zero address");
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
