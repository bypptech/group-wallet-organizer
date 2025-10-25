# NFT Project Template

## Project Configuration
- **Type**: Non-Fungible Token (NFT) Collection
- **Focus**: Digital collectibles, metadata management, marketplace integration
- **Standards**: ERC721, ERC1155, EIP-2981 (royalties)

## Smart Contract Structure

### Core Contracts
1. **NFT Collection** (`contracts/NFTCollection.sol`)
   - ERC721 or ERC1155 implementation
   - Minting mechanics (public, whitelist, auction)
   - Metadata URI management
   - Royalty implementation (EIP-2981)

2. **Marketplace** (`contracts/Marketplace.sol`)
   - Buy/sell functionality
   - Auction mechanisms
   - Offer system
   - Fee distribution

3. **Royalty Manager** (`contracts/RoyaltyManager.sol`)
   - Secondary sale royalty enforcement
   - Multi-party royalty splits
   - Royalty rate management

4. **Staking Contract** (`contracts/NFTStaking.sol`)
   - NFT staking for rewards
   - Trait-based reward multipliers
   - Utility token distribution

## AI Configuration

### Claude Prompts (NFT-focused)
```markdown
@tdd-nft-collection: Create comprehensive tests for NFT minting, transfers, and metadata
@tdd-nft-marketplace: Implement marketplace with listings, bids, and sales functionality
@tdd-nft-royalty: Build royalty system with EIP-2981 compliance and split functionality
@tdd-nft-staking: Design NFT staking with trait-based rewards and utility mechanics

Focus Areas:
- Gas-efficient batch operations
- Metadata integrity and IPFS integration
- Marketplace security and escrow mechanics
- Royalty enforcement across platforms
```

### Gemini Prompts (Requirements & Strategy)
```markdown
@kairo-nft-collection: Plan NFT collection strategy, rarity distribution, and minting mechanics
@kairo-nft-marketplace: Design marketplace features, fee structures, and user experience
@kairo-nft-utility: Develop utility mechanisms and holder benefits strategy
@kairo-nft-metadata: Plan metadata architecture and decentralized storage approach

Requirements Focus:
- Community engagement strategy
- Rarity and trait distribution
- Utility roadmap planning
- Cross-platform compatibility
```

## Contract Implementation Templates

### ERC721 Collection with Royalties
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract NFTCollection is ERC721, Ownable, IERC2981 {
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MINT_PRICE = 0.08 ether;
    uint256 public currentTokenId = 0;
    
    string private baseTokenURI;
    uint256 public royaltyBasisPoints = 750; // 7.5%
    address public royaltyRecipient;
    
    mapping(uint256 => string) private tokenURIs;
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        address _royaltyRecipient
    ) ERC721(name, symbol) {
        baseTokenURI = baseURI;
        royaltyRecipient = _royaltyRecipient;
    }
    
    function mint(address to, uint256 quantity) external payable {
        require(quantity > 0 && quantity <= 10, "Invalid quantity");
        require(currentTokenId + quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        
        for (uint256 i = 0; i < quantity; i++) {
            currentTokenId++;
            _safeMint(to, currentTokenId);
        }
    }
    
    function royaltyInfo(uint256, uint256 salePrice) 
        external view override returns (address, uint256) {
        return (royaltyRecipient, (salePrice * royaltyBasisPoints) / 10000);
    }
    
    function supportsInterface(bytes4 interfaceId) 
        public view virtual override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || 
               super.supportsInterface(interfaceId);
    }
}
```

## Test Cases Template

### Critical NFT Test Scenarios
1. **Minting Tests**
   - Public mint functionality
   - Whitelist mint validation
   - Supply limit enforcement
   - Payment verification

2. **Marketplace Tests**
   - Listing creation and cancellation
   - Bid placement and acceptance
   - Fee calculation accuracy
   - Ownership transfer verification

3. **Royalty Tests**
   - EIP-2981 compliance verification
   - Royalty calculation accuracy
   - Multi-party split functionality
   - Platform integration testing

4. **Metadata Tests**
   - IPFS integration validation
   - Metadata URI updates
   - Trait extraction accuracy
   - Image and animation support

## Frontend Integration

### Key Components
1. **Minting Interface**
   - Mint quantity selection
   - Whitelist verification
   - Payment processing
   - Transaction status tracking

2. **Collection Gallery**
   - NFT grid display
   - Filtering and sorting
   - Rarity information
   - Trait-based search

3. **Marketplace Interface**
   - Buy/sell functionality
   - Auction participation
   - Offer management
   - Transaction history

4. **Profile Dashboard**
   - Owned NFTs display
   - Staking interface
   - Reward tracking
   - Activity feed

## Metadata Standards

### OpenSea Compatible Metadata
```json
{
  "name": "NFT Name #1234",
  "description": "Detailed description of the NFT",
  "image": "ipfs://QmYourImageHash",
  "animation_url": "ipfs://QmYourAnimationHash",
  "external_url": "https://yourproject.com/nft/1234",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    },
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    },
    {
      "trait_type": "Power",
      "value": 85,
      "display_type": "number"
    }
  ]
}
```

## Security Checklist

### NFT-Specific Security Measures
- [ ] Reentrancy protection on mint and transfer functions
- [ ] Supply limit enforcement with overflow protection
- [ ] Proper access controls for admin functions
- [ ] Metadata immutability considerations
- [ ] Royalty rate bounds checking
- [ ] Marketplace escrow security
- [ ] Whitelist validation integrity
- [ ] Price manipulation resistance
- [ ] Front-running protection for limited drops
- [ ] IPFS pinning and backup strategies

## Launch Strategy

### Pre-Launch Checklist
1. **Collection Preparation**
   - Artwork generation and rarity distribution
   - Metadata preparation and IPFS upload
   - Smart contract deployment and verification
   - Website and marketplace integration

2. **Community Building**
   - Discord/Twitter community setup
   - Whitelist campaign execution
   - Influencer partnerships
   - Marketing material creation

3. **Technical Setup**
   - IPFS infrastructure setup
   - CDN configuration for fast loading
   - Analytics implementation
   - Monitoring and alerting systems

### Launch Day Execution
1. **Pre-launch (24h)**
   - Final contract verification
   - Community announcement
   - Technical system checks

2. **Launch Window**
   - Mint activation
   - Real-time monitoring
   - Community support
   - Transaction verification

3. **Post-launch**
   - Marketplace listings
   - Community engagement
   - Roadmap milestone updates
   - Utility feature rollout

## Utility Integration Examples

### Staking Mechanics
```solidity
contract NFTStaking {
    struct StakeInfo {
        uint256 tokenId;
        uint256 stakeTime;
        uint256 lastRewardClaim;
    }
    
    mapping(address => StakeInfo[]) public stakedNFTs;
    mapping(uint256 => uint256) public traitMultipliers;
    
    function stakeNFT(uint256 tokenId) external {
        nftContract.transferFrom(msg.sender, address(this), tokenId);
        stakedNFTs[msg.sender].push(StakeInfo({
            tokenId: tokenId,
            stakeTime: block.timestamp,
            lastRewardClaim: block.timestamp
        }));
    }
    
    function calculateRewards(address user) public view returns (uint256) {
        uint256 totalRewards = 0;
        StakeInfo[] memory stakes = stakedNFTs[user];
        
        for (uint256 i = 0; i < stakes.length; i++) {
            uint256 stakeDuration = block.timestamp - stakes[i].lastRewardClaim;
            uint256 baseReward = stakeDuration * BASE_REWARD_RATE;
            uint256 multiplier = getTraitMultiplier(stakes[i].tokenId);
            totalRewards += baseReward * multiplier / 100;
        }
        
        return totalRewards;
    }
}
```

## Integration Guidelines

This template provides:
- Complete NFT contract architecture with marketplace integration
- Royalty management system for creator compensation
- AI prompts optimized for NFT development workflows
- Metadata standards for major marketplace compatibility
- Community engagement and launch strategies
- Utility mechanisms for long-term value creation

Use this template when creating:
- PFP (Profile Picture) collections
- Utility NFT projects
- Gaming asset collections
- Art and collectible drops
- Membership token systems