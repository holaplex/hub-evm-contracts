// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

interface IERC1155Edition {
    struct ChangeableInfo {
        string description;
        string imageUri;
        string collection;
        string uri;
    }

    struct Edition {
        address creator;
        address owner;
        bool isEditEnabled;
        uint256 createdAt;
        ChangeableInfo info;
    }

    function __ERC1155Edition_init(string calldata uri_) external;

    function supportsInterface(bytes4 interfaceId_) external view returns (bool);
    
    function createNewEdition(uint256 id_, Edition calldata info_) external;

    function disableEdit(uint256 id_) external;

    function editEdition(uint256 id_, ChangeableInfo calldata info_) external;

    function transferEditionOwnership(uint256 id_, address to_) external;

    function mint(address to_, uint256 id_, uint256 amount_) external; 
}