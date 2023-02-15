import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract HolaplexNFT is ERC2981Upgradeable, ERC1155Upgradeable, OwnableUpgradeable {
    
    mapping(address => uint256) public ownerToEdition;
    mappint(uint256 => address) public editionToOwner;

    modifier onlyEditionOwner(uint256 editionId) {
        require(editionId == ownerToEdition[msg.sender], "HNFT: not ediditon owner");
        _;
    }
    
    function __HolaplexNFT_init(string memory uri_) external initializer {
        __Ownable_init();
        __ERC1155_init(uri_);
        __ERC2981_init();
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Upgradeable,ERC2981Upgradeable) returns (bool) {
        return ERC1155Upgradeable.supportsInterface(interfaceId) || ERC2981Upgradeable.supportsInterface(interfaceId);
    }

    function createNewEdition(address editionOwner, uint256 id) external onlyOwner {

    }

    function mint(address to, uint256 id, uint256 amount) external onlyEditionOwner(id) {
        _mint(to, id, amount, "");
    }


}