// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

interface IERC1155Edition {
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

    function __ERC1155Edition_init(string calldata uri_) external;

    function supportsInterface(bytes4 interfaceId_) external view returns (bool);
    
    function createEdition(uint256 id_, Edition calldata info_, uint256 toMintAmount_) external;

    function disableEdit(uint256 id_) external;

    function editEdition(uint256 id_, EditionInfo calldata info_) external;

    function transferEditionOwnership(uint256 id_, address to_) external;

    function mint(address to_, uint256 id_, uint256 amount_) external; 
}