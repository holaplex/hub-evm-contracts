// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

import "../interfaces/tokens/IEditionContract.sol";
import "../interfaces/INFTSale.sol";

contract InterfaceId {
    function getIERC165() external pure returns (bytes4) {
        return type(IERC165Upgradeable).interfaceId;
    }

    function getIERC2981() external pure returns (bytes4) {
        return type(IERC2981Upgradeable).interfaceId;
    }

    function getIERC1155() external pure returns (bytes4) {
        return type(IERC1155Upgradeable).interfaceId;
    }

    function getIEditionContract() external pure returns (bytes4) {
        return type(IEditionContract).interfaceId;
    }

    function getINFTSale() external pure returns (bytes4) {
        return type(INFTSale).interfaceId;
    }
}
