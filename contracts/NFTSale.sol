// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";

import "./interfaces/INFTSale.sol";
import "./interfaces/tokens/IEditionContract.sol";

contract NFTSale is INFTSale {
    IEditionContract public editionContract;

    mapping(uint256 => Offer[]) public offers;

    constructor(address editionContractAddress_) {
        editionContract = IEditionContract(editionContractAddress_);
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(INFTSale).interfaceId;
    }

    function createSale(uint256 id_, uint256 amount_, uint256 price_) external returns (uint256) {
        return _createSale(id_, amount_, price_, msg.sender);
    }

    function createSalePermit(
        uint256 id_,
        uint256 amount_,
        uint256 price_,
        address saler_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external returns (uint256) {
        editionContract.permit(saler_, address(this), id_, amount_, deadline_, v_, r_, s_);

        return _createSale(id_, amount_, price_, saler_);
    }

    function deleteSale(uint256 tokenId_, uint256 saleId_) external {
        if (
            offers[tokenId_][saleId_].currentAmount == 0 ||
            msg.sender == offers[tokenId_][saleId_].saler
        ) {
            offers[tokenId_][saleId_].isClosed = true;

            emit SaleDeleted(tokenId_, saleId_);
        }
    }

    function buy(uint256 tokenId_, uint256 saleId_, uint256 amount_) external payable {
        Offer storage offer = offers[tokenId_][saleId_];
        require(!offer.isClosed, "NFTSale: sales closed");

        require(
            editionContract.balanceOf(offer.saler, tokenId_) >= amount_,
            "NFTSale: saler out of balance"
        );
        require(
            editionContract.allowance(offer.saler, address(this), tokenId_) >= amount_,
            "NFTSale: insufficient saler's allowance"
        );

        uint256 offerPrice_ = amount_ * offer.priceForToken;
        require(msg.value >= offerPrice_, "NFTSale: insufficient MATIC amount");

        uint256 currentAmount_ = offer.currentAmount;
        require(currentAmount_ >= amount_, "NFTSale: insufficient token amount");

        (address receiver_, uint256 fee_) = editionContract.royaltyInfo(
            offer.tokenId,
            offerPrice_
        );

        currentAmount_ -= amount_;

        offer.currentAmount = currentAmount_;

        if (currentAmount_ == 0) {
            offer.isClosed = true;
        }

        _sendNative(receiver_, fee_);
        _sendNative(offer.saler, offerPrice_ - fee_);

        editionContract.safeTransferFrom(offer.saler, msg.sender, offer.tokenId, amount_, "");

        /// @dev push back eth

        if (msg.value > offerPrice_) {
            _sendNative(msg.sender, msg.value - offerPrice_);
        }

        emit Bought(tokenId_, saleId_, amount_, msg.sender);
    }

    function _createSale(
        uint256 id_,
        uint256 amount_,
        uint256 price_,
        address saler_
    ) internal returns (uint256) {
        require(
            editionContract.allowance(saler_, address(this), id_) >= amount_,
            "NFTSale: insufficient allowance"
        );
        require(editionContract.balanceOf(saler_, id_) >= amount_, "NFTSale: insufficient amount");

        Offer[] storage _tokenOffers = offers[id_];
        _tokenOffers.push(
            Offer({
                saler: saler_,
                isClosed: false,
                tokenId: id_,
                currentAmount: amount_,
                priceForToken: price_
            })
        );

        emit SaleCreated(id_, _tokenOffers.length - 1, saler_);

        return _tokenOffers.length - 1;
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
