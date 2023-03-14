// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

interface INFTSale {
    struct Offer {
        address saler;
        bool isClosed;
        uint256 tokenId;
        uint256 currentAmount;
        uint256 priceForToken;
    }

    event SaleCreated(uint256 tokenId, uint256 saleId, address saler);
    event SaleDeleted(uint256 tokenId, uint256 saleId);
    event Bought(uint256 tokenId, uint256 saleId, uint256 amount, address buyer);

    function createSale(uint256 id_, uint256 amount_, uint256 price_) external returns (uint256);

    function createSalePermit(
        uint256 id_,
        uint256 amount_,
        uint256 price_,
        address saler_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external returns (uint256);

    function deleteSale(uint256 tokenId_, uint256 saleId_) external;

    function buy(uint256 tokenId_, uint256 saleId_, uint256 amount_) external payable;
}
