// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";

import "../proxy/IUUPSOwnable.sol";
import "./IERC1155Permit.sol";

interface IEditionContract is IERC2981Upgradeable, IERC1155Permit, IUUPSOwnable {
    struct EditionInfo {
        string description;
        string imageUri;
        string collection;
        string uri;
        address creator;
    }

    struct Edition {
        address owner;
        uint128 createdAt;
        bool isEditEnabled;
        EditionInfo info;
    }

    event EditionCreated(uint256 id, address owner);
    event EditDisabled(uint256 id);
    event EditionOwnershipTransfered(uint256, address to);
    event RoyaltyChanged(uint256 id, address receiver, uint96 feeNumerator);

    function __EditionContract_init(string calldata uri_) external;

    function supportsInterface(bytes4 interfaceId_) external view returns (bool);

    function ownerOf(uint256 id_) external view returns (address);

    function createEdition(
        uint256 id_,
        EditionInfo memory editionInfo_,
        address tokenReceiver,
        uint256 toMintAmount_,
        address feeReceiver_,
        uint96 feeNumerator_
    ) external;

    function disableEdit(uint256 id_) external;

    function editEdition(uint256 id_, EditionInfo calldata info_) external;

    function resetRoyalty(uint256 id_, address receiver_, uint96 feeNumerator_) external;

    function transferEditionOwnership(uint256 id_, address to_) external;

    function mint(address to_, uint256 id_, uint256 amount_) external;
}
