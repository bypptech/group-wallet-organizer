# DeFi Protocol Template

## Project Configuration
- **Type**: Decentralized Finance (DeFi) Protocol
- **Focus**: Token economics, liquidity management, yield farming
- **Security**: Flash loan protection, slippage control, reentrancy guards

## Smart Contract Structure

### Core Contracts
1. **Token Contract** (`contracts/Token.sol`)
   - ERC20 with extensions (burnable, mintable, permit)
   - Supply management and tokenomics
   - Governance integration

2. **Liquidity Pool** (`contracts/LiquidityPool.sol`)
   - Automated Market Maker (AMM) functionality
   - Fee distribution mechanism
   - Impermanent loss mitigation

3. **Staking Contract** (`contracts/Staking.sol`)
   - Reward distribution system
   - Lock-up periods and penalties
   - Compound staking mechanics

4. **Governance** (`contracts/Governance.sol`)
   - Proposal creation and voting
   - Timelock for security
   - Delegation mechanisms

## AI Configuration

### Claude Prompts (DeFi-focused)
```markdown
@tdd-defi-token: Create comprehensive tests for ERC20 token with tokenomics features
@tdd-defi-pool: Implement AMM pool with slippage protection and fee distribution
@tdd-defi-staking: Build staking contract with reward calculations and lock periods
@tdd-defi-governance: Design governance system with proposal lifecycle and voting

Focus Areas:
- Economic security and incentive alignment
- Flash loan attack prevention
- MEV resistance strategies
- Gas optimization for DeFi operations
```

### Gemini Prompts (Requirements & Architecture)
```markdown
@kairo-defi-tokenomics: Analyze token distribution and economic sustainability
@kairo-defi-liquidity: Design liquidity incentive mechanisms and pool strategies
@kairo-defi-risk: Assess protocol risks and mitigation strategies
@kairo-defi-governance: Plan decentralized governance transition strategy

Requirements Focus:
- Sustainable tokenomics model
- Liquidity bootstrapping strategy
- Multi-token pool support
- Cross-chain compatibility planning
```

## Test Cases Template

### Critical DeFi Test Scenarios
1. **Token Economics Tests**
   - Supply inflation/deflation mechanisms
   - Fee distribution fairness
   - Reward calculation accuracy

2. **Pool Security Tests**
   - Flash loan attack resistance
   - Price manipulation protection
   - Slippage limit enforcement

3. **Staking Mechanism Tests**
   - Reward accrual verification
   - Early withdrawal penalties
   - Compound interest calculations

4. **Governance Tests**
   - Proposal lifecycle validation
   - Vote counting accuracy
   - Timelock security verification

## Frontend Integration

### Key Components
1. **Pool Interface**
   - Add/remove liquidity
   - Swap functionality
   - Pool statistics display

2. **Staking Dashboard**
   - Stake/unstake interface
   - Reward tracking
   - Lock period visualization

3. **Governance Portal**
   - Proposal viewing and voting
   - Delegation management
   - Voting power display

## Security Checklist

### DeFi-Specific Security Measures
- [ ] Reentrancy guards on all state-changing functions
- [ ] Oracle price manipulation resistance
- [ ] Flash loan attack mitigation
- [ ] Integer overflow/underflow protection
- [ ] Access control for administrative functions
- [ ] Emergency pause mechanisms
- [ ] Slippage protection for all swaps
- [ ] Fee calculation accuracy verification
- [ ] Multi-signature requirements for critical operations
- [ ] Time delays for sensitive parameter changes

## Deployment Strategy

### Mainnet Deployment Checklist
1. **Pre-deployment**
   - Complete security audit
   - Economic model validation
   - Community testing phase

2. **Launch Sequence**
   - Deploy token contract
   - Initialize liquidity pools
   - Set up staking rewards
   - Activate governance

3. **Post-deployment**
   - Monitor pool dynamics
   - Track economic metrics
   - Governance transition planning

## Common DeFi Patterns

### Yield Farming Implementation
```solidity
// Reward calculation with compound interest
function calculateReward(address user) public view returns (uint256) {
    UserInfo storage userInfo = users[user];
    uint256 timeDiff = block.timestamp - userInfo.lastRewardTime;
    return userInfo.stakedAmount * rewardRate * timeDiff / PRECISION;
}
```

### AMM Pool Logic
```solidity
// Constant product formula with fees
function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) 
    public pure returns (uint256) {
    uint256 amountInWithFee = amountIn * 997; // 0.3% fee
    uint256 numerator = amountInWithFee * reserveOut;
    uint256 denominator = reserveIn * 1000 + amountInWithFee;
    return numerator / denominator;
}
```

## Integration Guidelines

This template provides:
- Pre-configured smart contract architecture for DeFi protocols
- AI prompts optimized for DeFi development challenges
- Comprehensive test coverage for financial security
- Frontend components for user interaction
- Security-first development approach
- Economic sustainability considerations

Use this template when creating:
- AMM protocols
- Yield farming platforms
- Lending/borrowing protocols
- Governance tokens
- Liquidity mining programs