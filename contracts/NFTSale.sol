// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";

import "./proxy/UUPSOwnable.sol";

import "./interfaces/INFTSale.sol";
import "./interfaces/tokens/IEditionContract.sol";

contract NFTSale is UUPSOwnable, INFTSale {
    IEditionContract public editionContract;

    mapping(uint256 => Listing[]) public listings;

    function NFTSaleInit(address editionContractAddress_) external initializer {
        __UUPSOwnable_init();
        editionContract = IEditionContract(editionContractAddress_);
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(INFTSale).interfaceId;
    }

    function createSale(uint256 id_, uint256 amount_, uint256 price_) external returns (uint256) {
        return _createSale(id_, amount_, price_, _msgSender());
    }

    function createSalePermit(
        uint256 id_,
        uint256 amount_,
        uint256 price_,
        address seller_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external returns (uint256) {
        editionContract.permit(seller_, address(this), id_, amount_, deadline_, v_, r_, s_);

        return _createSale(id_, amount_, price_, seller_);
    }

    function deleteSale(uint256 tokenId_, uint256 saleId_) external {
        if (
            listings[tokenId_][saleId_].currentAmount == 0 ||
            _msgSender() == listings[tokenId_][saleId_].seller
        ) {
            listings[tokenId_][saleId_].isClosed = true;

            emit SaleDeleted(tokenId_, saleId_);
        }
    }

    function buy(uint256 tokenId_, uint256 saleId_, uint256 amount_) external payable {
        Listing storage listing = listings[tokenId_][saleId_];
        require(!listing.isClosed, "NFTSale: sales closed");

        require(
            editionContract.balanceOf(listing.seller, tokenId_) >= amount_,
            "NFTSale: seller out of balance"
        );
        require(
            editionContract.allowance(listing.seller, address(this), tokenId_) >= amount_,
            "NFTSale: insufficient seller's allowance"
        );

        uint256 offerPrice_ = amount_ * listing.priceForToken;
        require(msg.value >= offerPrice_, "NFTSale: insufficient MATIC amount");

        uint256 currentAmount_ = listing.currentAmount;
        require(currentAmount_ >= amount_, "NFTSale: insufficient token amount");

        (address receiver_, uint256 fee_) = editionContract.royaltyInfo(
            listing.tokenId,
            offerPrice_
        );

        currentAmount_ -= amount_;

        listing.currentAmount = currentAmount_;

        if (currentAmount_ == 0) {
            listing.isClosed = true;
        }

        _sendNative(receiver_, fee_);
        _sendNative(listing.seller, offerPrice_ - fee_);

        editionContract.safeTransferFrom(
            listing.seller,
            _msgSender(),
            listing.tokenId,
            amount_,
            ""
        );

        /// @dev push back eth

        if (msg.value > offerPrice_) {
            _sendNative(_msgSender(), msg.value - offerPrice_);
        }

        emit Bought(tokenId_, saleId_, amount_, _msgSender());
    }

    function _createSale(
        uint256 id_,
        uint256 amount_,
        uint256 price_,
        address seller_
    ) internal returns (uint256) {
        require(
            editionContract.allowance(seller_, address(this), id_) >= amount_,
            "NFTSale: insufficient allowance"
        );
        require(
            editionContract.balanceOf(seller_, id_) >= amount_,
            "NFTSale: insufficient amount"
        );

        Listing[] storage tokenListings = listings[id_];
        tokenListings.push(
            Listing({
                seller: seller_,
                isClosed: false,
                tokenId: id_,
                currentAmount: amount_,
                priceForToken: price_
            })
        );

        emit SaleCreated(id_, tokenListings.length - 1, seller_);

        return tokenListings.length - 1;
    }

    function _sendNative(address to_, uint256 amount_) internal {
        (bool sent, ) = to_.call{value: amount_}("");
        require(sent, "NFTSale: failed to send ETH");
    }

    /**
     * This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[45] private __gap;
}
