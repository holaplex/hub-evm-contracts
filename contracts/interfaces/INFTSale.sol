interface INFTSale {
    struct Offer {
        address saler;
        bool isClosed;
        uint256 tokenId;
        uint256 currentAmount;
        uint256 totalAmount;
        uint256 priceForToken;
    }

    function __NFTSale_init(address editionNFTAddress_) external;

    function createSale(Offer memory offer_) external returns (uint256);

    function createSalePermit(
        Offer memory offer_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external returns (uint256);

    function deleteSale(uint256 saleId_) external;

    function buy(uint256 saleId_, uint256 amount_) external payable;

    function getOffer(uint256 saleId_) external view returns (Offer memory);
}
