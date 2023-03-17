// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";

import "../proxy/IUUPSOwnable.sol";
import "./IERC1155Permit.sol";

interface IEditionContract is IERC2981Upgradeable, IERC1155Permit, IUUPSOwnable {
    /**
     * @notice struct stores information about info-only paramters
     * @param description the string with edition description
     * @param imageUri the string with uri
     * @param collection the information string about collection
     * @param uri the string with tokne uri
     * @param creator the address of edition creation
     */
    struct EditionInfo {
        string description;
        string imageUri;
        string collection;
        string uri;
        address creator;
    }

    /**
     * @notice struct stores information about changeable parameters
     * @param owner the address of current edition owner
     * @param createdAt the timestamp of creation
     * @param isEditEnabled the bool flag, is false - inforamtion fields can't be changed
     * @param info the EditionInfo struct
     */
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

    /**
     * @notice the function for initialize contract
     * @param uri_ the uri string
     */
    function __EditionContract_init(string calldata uri_) external;

    /// @inheritdoc IERC165Upgradeable
    function supportsInterface(bytes4 interfaceId_) external view returns (bool);

    /**
     * @notice The function for getting owner of edition
     * @param id_ the id of edition
     * @return owner of edition
     */
    function ownerOf(uint256 id_) external view returns (address);

    /**
     * @notice The function for creating new edition
     * @param id_ the id of edition
     * @param editionInfo_ the struct with info-only parameters
     * @param tokenReceiver_ the address of minted token receiver
     * @param toMintAmount_ the amount of tokens to mint
     * @param feeReceiver_ the address of fee receiver
     * @param feeNumerator_ the fee percentage numerator
     */
    function createEdition(
        uint256 id_,
        EditionInfo memory editionInfo_,
        address tokenReceiver_,
        uint256 toMintAmount_,
        address feeReceiver_,
        uint96 feeNumerator_
    ) external;

    /**
     * @notice The fucntion for disabling edit for edition
     * @param id_ the id of edition
     */
    function disableEdit(uint256 id_) external;

    /**
     * @notice the function for changing info-only parameters
     * @param id_ the id of edition
     * @param info_ the EditionInfo struct with new parameters
     */
    function editEdition(uint256 id_, EditionInfo calldata info_) external;

    /**
     * @notice The function for reseting royalty parameters
     * @param id_ the id of edition
     * @param receiver_ the address of new fee receiver
     * @param feeNumerator_ the new fee percentage numerator
     */
    function resetRoyalty(uint256 id_, address receiver_, uint96 feeNumerator_) external;

    /**
     * @notice The function for transfering ownership of edition
     * @param id_ the id of edition
     * @param to_ the address of new edition owner
     */
    function transferEditionOwnership(uint256 id_, address to_) external;

    /**
     * @notice The function for token minting
     * @param to_ the address of minted tokens receiver
     * @param id_ the id of edition
     * @param amount_ the amount to mint
     */
    function mint(address to_, uint256 id_, uint256 amount_) external;
}
