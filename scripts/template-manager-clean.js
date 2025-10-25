#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Template configurations
export const TEMPLATES = {
  'defi': {
    name: 'DeFi Protocol',
    description: 'Automated Market Makers, Yield Farming, Liquidity Pools',
    files: ['defi-template.md'],
    contracts: ['Token.sol', 'LiquidityPool.sol', 'Staking.sol', 'Governance.sol'],
    testFiles: ['Token.test.js', 'LiquidityPool.test.js', 'Staking.test.js', 'Governance.test.js'],
    aiPrompts: {
      claude: ['@tdd-defi-token', '@tdd-defi-pool', '@tdd-defi-staking', '@tdd-defi-governance'],
      gemini: ['@kairo-defi-tokenomics', '@kairo-defi-liquidity', '@kairo-defi-risk', '@kairo-defi-governance']
    }
  },
  'nft': {
    name: 'NFT Collection',
    description: 'Digital collectibles, Marketplaces, Royalty systems',
    files: ['nft-template.md'],
    contracts: ['NFTCollection.sol', 'Marketplace.sol', 'RoyaltyManager.sol', 'NFTStaking.sol'],
    testFiles: ['NFTCollection.test.js', 'Marketplace.test.js', 'RoyaltyManager.test.js', 'NFTStaking.test.js'],
    aiPrompts: {
      claude: ['@tdd-nft-collection', '@tdd-nft-marketplace', '@tdd-nft-royalty', '@tdd-nft-staking'],
      gemini: ['@kairo-nft-collection', '@kairo-nft-marketplace', '@kairo-nft-utility', '@kairo-nft-metadata']
    }
  },
  'dao': {
    name: 'DAO Governance',
    description: 'Decentralized governance, Voting systems, Treasury management',
    files: ['dao-template.md'],
    contracts: ['GovernanceToken.sol', 'Governor.sol', 'TimelockController.sol', 'Treasury.sol'],
    testFiles: ['GovernanceToken.test.js', 'Governor.test.js', 'TimelockController.test.js', 'Treasury.test.js'],
    aiPrompts: {
      claude: ['@tdd-dao-governance', '@tdd-dao-token', '@tdd-dao-timelock', '@tdd-dao-treasury'],
      gemini: ['@kairo-dao-structure', '@kairo-dao-tokenomics', '@kairo-dao-treasury', '@kairo-dao-community']
    }
  },
  'gaming': {
    name: 'GameFi/Web3 Gaming',
    description: 'Play-to-earn mechanics, Game tokens, NFT items',
    files: ['gaming-template.md'],
    contracts: ['GameToken.sol', 'GameItems.sol', 'PlayerRegistry.sol', 'GameLogic.sol'],
    testFiles: ['GameToken.test.js', 'GameItems.test.js', 'PlayerRegistry.test.js', 'GameLogic.test.js'],
    aiPrompts: {
      claude: ['@tdd-game-economy', '@tdd-game-items', '@tdd-game-battles', '@tdd-game-marketplace'],
      gemini: ['@kairo-game-economy', '@kairo-game-progression', '@kairo-game-social', '@kairo-game-retention']
    }
  },
  'custom': {
    name: 'Custom Project',
    description: 'Flexible template for custom Web3 applications',
    files: [],
    contracts: ['BaseContract.sol'],
    testFiles: ['BaseContract.test.js'],
    aiPrompts: {
      claude: ['@tdd-requirements', '@tdd-testcases', '@tdd-red', '@tdd-green', '@tdd-refactor'],
      gemini: ['@kairo-requirements', '@kairo-design', '@kairo-tasks', '@kairo-implement']
    }
  }
};

// Contract templates for each project type
const CONTRACT_TEMPLATES = {
  defi: {
    'Token.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18; // 1B tokens
    
    constructor() ERC20("DeFi Token", "DEFI") {}
    
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }
}`,
    'LiquidityPool.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LiquidityPool is ReentrancyGuard {
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalLiquidity;
    
    mapping(address => uint256) public liquidity;
    
    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }
    
    function addLiquidity(uint256 amountA, uint256 amountB) external nonReentrant {
        // Implementation for adding liquidity
        require(amountA > 0 && amountB > 0, "Invalid amounts");
        // TODO: Implement AMM logic
    }
    
    function swap(address tokenIn, uint256 amountIn) external nonReentrant {
        require(amountIn > 0, "Invalid amount");
        // TODO: Implement swap logic with fees
    }
}`,
    'Staking.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is ReentrancyGuard, Ownable {
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;
    
    uint256 public rewardRate = 100; // tokens per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public balances;
    
    uint256 private _totalSupply;
    
    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }
    
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        _totalSupply += amount;
        balances[msg.sender] += amount;
        stakingToken.transferFrom(msg.sender, address(this), amount);
    }
    
    function earned(address account) public view returns (uint256) {
        return ((balances[account] * 
            (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) + 
            rewards[account];
    }
    
    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + 
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / _totalSupply);
    }
    
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }
}`,
    'Governance.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Governance is Ownable {
    IERC20 public immutable governanceToken;
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    uint256 public proposalCount;
    uint256 public votingPeriod = 3 days;
    uint256 public proposalThreshold = 1000e18; // 1000 tokens
    
    event ProposalCreated(uint256 proposalId, address proposer, string description);
    event VoteCast(address voter, uint256 proposalId, bool support, uint256 weight);
    
    constructor(address _governanceToken) {
        governanceToken = IERC20(_governanceToken);
    }
    
    function propose(string memory description) external returns (uint256) {
        require(governanceToken.balanceOf(msg.sender) >= proposalThreshold, "Insufficient tokens");
        
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + votingPeriod,
            executed: false
        });
        
        emit ProposalCreated(proposalCount, msg.sender, description);
        return proposalCount;
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        uint256 weight = governanceToken.balanceOf(msg.sender);
        hasVoted[proposalId][msg.sender] = true;
        
        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }
        
        emit VoteCast(msg.sender, proposalId, support, weight);
    }
}`
  },
  nft: {
    'NFTCollection.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTCollection is ERC721, Ownable {
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public currentTokenId = 0;
    string private baseTokenURI;
    
    constructor(string memory name, string memory symbol, string memory baseURI) 
        ERC721(name, symbol) {
        baseTokenURI = baseURI;
    }
    
    function mint(address to) external onlyOwner {
        require(currentTokenId < MAX_SUPPLY, "Max supply reached");
        currentTokenId++;
        _safeMint(to, currentTokenId);
    }
}`,
    'Marketplace.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }
    
    mapping(bytes32 => Listing) public listings;
    uint256 public marketplaceFee = 250; // 2.5%
    
    event ItemListed(bytes32 indexed listingId, address indexed seller, uint256 price);
    
    function listItem(address nftContract, uint256 tokenId, uint256 price) external {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not owner");
        bytes32 listingId = keccak256(abi.encodePacked(nftContract, tokenId, msg.sender));
        
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });
        
        emit ItemListed(listingId, msg.sender, price);
    }
}`,
    'RoyaltyManager.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract RoyaltyManager is Ownable {
    struct RoyaltyInfo {
        address recipient;
        uint256 royaltyFraction;
    }
    
    mapping(address => RoyaltyInfo) public contractRoyalties;
    uint256 public constant MAX_ROYALTY = 1000; // 10%
    
    function setContractRoyalty(address nftContract, address recipient, uint256 royaltyFraction) external onlyOwner {
        require(royaltyFraction <= MAX_ROYALTY, "Royalty too high");
        contractRoyalties[nftContract] = RoyaltyInfo(recipient, royaltyFraction);
    }
}`,
    'NFTStaking.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTStaking is ReentrancyGuard {
    IERC721 public immutable nftContract;
    
    struct StakeInfo {
        address owner;
        uint256 stakedAt;
    }
    
    mapping(uint256 => StakeInfo) public stakedTokens;
    
    constructor(address _nftContract) {
        nftContract = IERC721(_nftContract);
    }
    
    function stake(uint256 tokenId) external {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");
        nftContract.transferFrom(msg.sender, address(this), tokenId);
        
        stakedTokens[tokenId] = StakeInfo({
            owner: msg.sender,
            stakedAt: block.timestamp
        });
    }
}`
  },
  dao: {
    'GovernanceToken.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20, ERC20Votes {
    constructor() ERC20("DAO Token", "DAO") ERC20Permit("DAO Token") {
        _mint(msg.sender, 10_000_000e18);
    }
    
    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}`,
    'Governor.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";

contract Governor is Governor, GovernorCountingSimple, GovernorVotes {
    constructor(IVotes _token) 
        Governor("MyGovernor")
        GovernorVotes(_token) {}
    
    function votingDelay() public pure override returns (uint256) {
        return 1; // 1 block
    }
    
    function votingPeriod() public pure override returns (uint256) {
        return 45818; // 1 week
    }
    
    function proposalThreshold() public pure override returns (uint256) {
        return 0;
    }
}`,
    'TimelockController.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract MyTimelockController is TimelockController {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}`,
    'Treasury.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Treasury is Ownable {
    mapping(address => bool) public authorized;
    
    event FundsReceived(address from, uint256 amount);
    
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
    
    function setAuthorization(address account, bool isAuthorized) external onlyOwner {
        authorized[account] = isAuthorized;
    }
}`
  },
  gaming: {
    'GameToken.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract GameToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18;
    
    constructor() ERC20("GameToken", "GAME") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    function mintReward(address player, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(player, amount);
    }
}`,
    'GameItems.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract GameItems is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _tokenIds;
    
    enum ItemType { WEAPON, ARMOR, CONSUMABLE }
    
    struct Item {
        ItemType itemType;
        uint256 attack;
        uint256 defense;
    }
    
    mapping(uint256 => Item) public items;
    
    constructor() ERC721("GameItems", "ITEMS") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    function mintItem(address player, ItemType itemType, uint256 attack, uint256 defense) 
        external onlyRole(MINTER_ROLE) returns (uint256) {
        _tokenIds++;
        uint256 tokenId = _tokenIds;
        
        items[tokenId] = Item(itemType, attack, defense);
        _safeMint(player, tokenId);
        
        return tokenId;
    }
    
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}`,
    'PlayerRegistry.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract PlayerRegistry is AccessControl {
    bytes32 public constant GAME_ROLE = keccak256("GAME_ROLE");
    
    struct Player {
        string username;
        uint256 level;
        uint256 experience;
        bool isRegistered;
    }
    
    mapping(address => Player) public players;
    mapping(string => address) public usernameToAddress;
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GAME_ROLE, msg.sender);
    }
    
    function registerPlayer(string memory username) external {
        require(!players[msg.sender].isRegistered, "Already registered");
        require(usernameToAddress[username] == address(0), "Username taken");
        
        players[msg.sender] = Player(username, 1, 0, true);
        usernameToAddress[username] = msg.sender;
    }
}`,
    'GameLogic.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract GameLogic is AccessControl {
    enum GameState { WAITING, ACTIVE, FINISHED }
    
    struct Game {
        uint256 gameId;
        address[] players;
        GameState state;
        uint256 startTime;
        address winner;
    }
    
    mapping(uint256 => Game) public games;
    uint256 public gameCounter;
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function createGame() external returns (uint256) {
        gameCounter++;
        games[gameCounter].gameId = gameCounter;
        games[gameCounter].state = GameState.WAITING;
        games[gameCounter].players.push(msg.sender);
        
        return gameCounter;
    }
}`
  },
  custom: {
    'BaseContract.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BaseContract is Ownable, ReentrancyGuard {
    uint256 public value;
    mapping(address => uint256) public balances;
    
    event ValueUpdated(uint256 oldValue, uint256 newValue);
    
    function setValue(uint256 _value) external onlyOwner {
        uint256 oldValue = value;
        value = _value;
        emit ValueUpdated(oldValue, _value);
    }
    
    function withdraw() external nonReentrant {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance to withdraw");
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(balance);
    }
}`
  }
};

export const generateContractTemplate = (templateType, contractName) => {
  return CONTRACT_TEMPLATES[templateType]?.[contractName] || generateBaseContract(contractName);
};

export const generateTestTemplate = (templateType, testName) => {
  const contractName = testName.replace('.test.js', '');
  return `const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("${contractName}", function () {
  let contract;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const Contract = await ethers.getContractFactory("${contractName}");
    contract = await Contract.deploy();
    await contract.deployed();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(contract.address).to.not.equal("0x0000000000000000000000000000000000000000");
    });
  });

  describe("Core Functionality", function () {
    it("Should implement core functionality", async function () {
      // TODO: Add ${templateType}-specific tests
      expect(true).to.equal(true);
    });
  });
});`;
};

const generateBaseContract = (contractName) => {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ${contractName.replace('.sol', '')} is Ownable, ReentrancyGuard {
    // TODO: Add contract logic
    
    constructor() {
        // TODO: Initialize contract
    }
    
    // TODO: Add functions
}`;
};

export const applyTemplate = (projectPath, templateType) => {
  console.log(`📄 Applying ${templateType} template...`);
  
  const template = TEMPLATES[templateType];
  if (!template) {
    throw new Error(`Template ${templateType} not found`);
  }
  
  // Create contract files
  const contractsDir = path.join(projectPath, 'contracts');
  fs.mkdirSync(contractsDir, { recursive: true });
  template.contracts.forEach(contractName => {
    const contractContent = generateContractTemplate(templateType, contractName);
    const contractPath = path.join(contractsDir, contractName);
    fs.writeFileSync(contractPath, contractContent);
    console.log(`  ✅ Created ${contractName}`);
  });
  
  // Create test files
  const testDir = path.join(projectPath, 'test');
  fs.mkdirSync(testDir, { recursive: true });
  template.testFiles.forEach(testName => {
    const testContent = generateTestTemplate(templateType, testName);
    const testPath = path.join(testDir, testName);
    fs.writeFileSync(testPath, testContent);
    console.log(`  ✅ Created ${testName}`);
  });
  
  // Update AI configurations
  updateAIConfigurations(projectPath, template, templateType);
  
  console.log(`✅ ${template.name} template applied successfully`);
};

const updateAIConfigurations = (projectPath, template, templateType) => {
  // Update Claude configuration
  const claudeConfigPath = path.join(projectPath, '.claude/commands/project-config.md');
  if (fs.existsSync(claudeConfigPath)) {
    let claudeConfig = fs.readFileSync(claudeConfigPath, 'utf8');
    const templateCommands = template.aiPrompts.claude.map(cmd => `- ${cmd}: ${getCommandDescription(cmd)}`).join('\n');
    claudeConfig += `\n\n## ${template.name} Specific Commands\n${templateCommands}`;
    fs.writeFileSync(claudeConfigPath, claudeConfig);
  }
  
  // Update Gemini configuration  
  const geminiConfigPath = path.join(projectPath, '.gemini/prompts/project-config.md');
  if (fs.existsSync(geminiConfigPath)) {
    let geminiConfig = fs.readFileSync(geminiConfigPath, 'utf8');
    const templatePrompts = template.aiPrompts.gemini.map(cmd => `- ${cmd}: ${getCommandDescription(cmd)}`).join('\n');
    geminiConfig += `\n\n## ${template.name} Specific Prompts\n${templatePrompts}`;
    fs.writeFileSync(geminiConfigPath, geminiConfig);
  }
};

const getCommandDescription = (command) => {
  const descriptions = {
    '@tdd-defi-token': 'Create comprehensive tests for ERC20 token with tokenomics features',
    '@tdd-defi-pool': 'Implement AMM pool with slippage protection and fee distribution',
    '@tdd-defi-staking': 'Build staking contract with reward calculations and lock periods',
    '@tdd-defi-governance': 'Design governance system with proposal lifecycle and voting',
    '@kairo-defi-tokenomics': 'Analyze token distribution and economic sustainability',
    '@kairo-defi-liquidity': 'Design liquidity incentive mechanisms and pool strategies',
    '@kairo-defi-risk': 'Assess protocol risks and mitigation strategies',
    '@kairo-defi-governance': 'Plan decentralized governance transition strategy',
    '@tdd-nft-collection': 'Create comprehensive tests for NFT minting, transfers, and metadata',
    '@tdd-nft-marketplace': 'Implement marketplace with listings, bids, and sales functionality',
    '@tdd-nft-royalty': 'Build royalty system with EIP-2981 compliance and split functionality',
    '@tdd-nft-staking': 'Design NFT staking with trait-based rewards and utility mechanics',
    '@kairo-nft-collection': 'Plan NFT collection strategy, rarity distribution, and minting mechanics',
    '@kairo-nft-marketplace': 'Design marketplace features, fee structures, and user experience',
    '@kairo-nft-utility': 'Develop utility mechanisms and holder benefits strategy',
    '@kairo-nft-metadata': 'Plan metadata architecture and decentralized storage approach'
  };
  
  return descriptions[command] || 'Template-specific command';
};

export const listAvailableTemplates = () => {
  console.log('📋 Available Templates:');
  console.log('='.repeat(25));
  
  Object.entries(TEMPLATES).forEach(([key, template], index) => {
    console.log(`${index + 1}. ${template.name}`);
    console.log(`   ${template.description}`);
    console.log(`   Contracts: ${template.contracts.length}`);
    console.log(`   Tests: ${template.testFiles.length}`);
    console.log();
  });
};

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  listAvailableTemplates();
}