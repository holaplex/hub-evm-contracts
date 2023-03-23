// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface INFTSale {
    /**
     * @notice The struct holds information about sale offer
     * @param seller the address of seller
     * @param isCloset the bool flag, if true - sale is closed
     * @param tokenId the id of edition
     * @param currentAmount the current amount to sale
     * @param priceForToken the price in wei of one token
     */
    struct Offer {
        address seller;
        bool isClosed;
        uint256 tokenId;
        uint256 currentAmount;
        uint256 priceForToken;
    }

    event SaleCreated(uint256 tokenId, uint256 saleId, address seller);
    event SaleDeleted(uint256 tokenId, uint256 saleId);
    event Bought(uint256 tokenId, uint256 saleId, uint256 amount, address buyer);

    /**
     * @notice The function for sale creation
     * @param id_ the id of edition
     * @param amount_ the amount of sales tokens
     * @param price_ the price of one token
     * @return saleId the id of sale
     */
    function createSale(uint256 id_, uint256 amount_, uint256 price_) external returns (uint256);

    /**
     * @notice The function for sale creation
     * @param id_ the id of edition
     * @param amount_ the amount of sales tokens
     * @param price_ the price of one token
     * @param seller_ the address of seller
     * @param deadline_ the timestamp up to which permit can be used
     * @param v_ the part of owner's signature
     * @param r_ the part of owner's signature
     * @param s_ the part of owner's signature
     * @return saleId the id of sale
     */
    function createSalePermit(
        uint256 id_,
        uint256 amount_,
        uint256 price_,
        address seller_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external returns (uint256);

    /**
     * @notice The function for deleting sale (setting `isCloset` flag in true)
     * @param tokenId_ the id of edition
     * @param saleId_ the id of sale
     */
    function deleteSale(uint256 tokenId_, uint256 saleId_) external;

    /**
     * @notice The function for buying token
     * @param tokenId_ the id of edition
     * @param saleId_ the id of sale
     * @param amount_ the purchase amount
     */
    function buy(uint256 tokenId_, uint256 saleId_, uint256 amount_) external payable;
}
