// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155ReceiverUpgradeable.sol";

import "../interfaces/INFTSale.sol";

contract WithoutReceive is ERC1155ReceiverUpgradeable {
    INFTSale public nftSale;

    constructor(INFTSale nftSale_) {
        nftSale = nftSale_;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4) {
        return
            bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"));
    }

    function buy(uint256 tokenId_, uint256 saleId_, uint256 amount_) external payable {
        nftSale.buy{value: msg.value}(tokenId_, saleId_, amount_);
    }
}
