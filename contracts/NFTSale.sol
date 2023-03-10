// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155ReceiverUpgradeable.sol";

import "./proxy/UUPSOwnable.sol";
import "./tokens/ERC1155Edition.sol";
import "./interfaces/INFTSale.sol";

contract NFTSale is UUPSOwnable, IERC1155ReceiverUpgradeable, INFTSale {
    ERC1155Edition public editionNFT;

    Offer[] private _offers;
    mapping(uint256 => uint256[]) public nftIdToSaleIds;

    uint256 private _latestId;

    modifier onlyOwnerOrSpender(address spender_) {
        require(
            owner() == _msgSender() || spender_ == _msgSender(),
            "NFTSale: caller is not the owner or spender"
        );
        _;
    }

    function __NFTSale_init(address editionNFTAddress_) external initializer {
        __UUPSOwnable_init();
        editionNFT = ERC1155Edition(editionNFTAddress_);
    }

    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        return interfaceId == type(INFTSale).interfaceId;
    }

    function getOffer(uint256 saleId_) external view returns (Offer memory) {
        return _offers[saleId_];
    }

    function createSale(
        Offer memory offer_
    ) external onlyOwnerOrSpender(offer_.saler) returns (uint256) {
        return _createSale(offer_);
    }

    function createSalePermit(
        Offer memory offer_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external onlyOwnerOrSpender(offer_.saler) returns (uint256) {
        editionNFT.permit(
            offer_.saler,
            address(this),
            offer_.tokenId,
            offer_.totalAmount,
            deadline_,
            v_,
            r_,
            s_
        );

        return _createSale(offer_);
    }

    function deleteSale(uint256 saleId_) external onlyOwnerOrSpender(_offers[saleId_].saler) {
        Offer storage _offer = _offers[saleId_];
        editionNFT.safeTransferFrom(
            address(this),
            _msgSender(),
            _offer.tokenId,
            _offer.totalAmount - _offer.currentAmount,
            ""
        );
        _offer.isClosed = true;
    }

    function buy(uint256 saleId_, uint256 amount_) external payable {
        Offer storage _offer = _offers[saleId_];
        uint256 nftCost = amount_ * _offer.priceForToken;
        (address receiver, uint256 fee) = editionNFT.royaltyInfo(_offer.tokenId, nftCost);
        uint256 payableAmount = nftCost + fee;

        require(!_offer.isClosed, "NFTSale: sales closed");
        require(_offer.currentAmount >= amount_, "NFTSale: insufficient token amount");
        require(msg.value >= nftCost, "NFTSale: insufficient MATIC amount");

        _offer.currentAmount -= amount_;
        if (_offer.currentAmount == 0) {
            _offer.isClosed = true;
        }

        _sendNative(receiver, fee);

        editionNFT.safeTransferFrom(address(this), _msgSender(), _offer.tokenId, amount_, "");

        /// @dev push back eth

        if (msg.value > payableAmount) {
            _sendNative(_msgSender(), msg.value - payableAmount);
        }
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

    function _createSale(Offer memory offer_) internal returns (uint256) {
        offer_.currentAmount = offer_.totalAmount;
        editionNFT.safeTransferFrom(
            offer_.saler,
            address(this),
            offer_.tokenId,
            offer_.totalAmount,
            ""
        );

        uint256 currentId = _latestId;

        _offers.push(offer_);
        nftIdToSaleIds[offer_.tokenId].push(currentId);
        _latestId = currentId + 1;

        return currentId;
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
