// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ERC20Paymaster
 * @notice ERC-4337準拠のPaymaster実装
 * @dev USDC/JPYCなどのERC20トークンでガス料金を支払うPaymaster
 *
 * ## 主要機能
 * - ERC20トークンによるガススポンサーシップ
 * - トークン残高チェック
 * - 日次上限管理
 * - Oracle連携による換算レート取得
 * - 緊急停止機能
 *
 * ## セキュリティ
 * - UUPS Upgradeable Pattern
 * - ReentrancyGuard
 * - AccessControl (ADMIN, ORACLE)
 * - 日次上限チェック
 */
contract ERC20Paymaster is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    // ============================================
    // Roles
    // ============================================
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // ============================================
    // Storage
    // ============================================

    /// @notice EntryPoint address (ERC-4337)
    address public entryPoint;

    /// @notice サポートされているトークン
    mapping(address => bool) public supportedTokens;

    /// @notice トークンごとの換算レート (token per ETH, 18 decimals)
    mapping(address => uint256) public tokenPrices;

    /// @notice ユーザーごとの日次使用量 (ETH換算)
    mapping(address => DailySpend) public dailySpends;

    /// @notice 日次上限 (ETH換算, wei)
    uint256 public dailySpendLimit;

    /// @notice Paymasterのデポジット残高 (EntryPointへ)
    uint256 public depositBalance;

    /// @notice 緊急停止フラグ
    bool public paused;

    /// @notice 最小トークン残高 (トークンごと)
    mapping(address => uint256) public minTokenBalance;

    /// @notice 日次使用量追跡
    struct DailySpend {
        uint256 amount;      // ETH換算の使用量
        uint256 lastResetDay; // 最後にリセットした日
    }

    // ============================================
    // Events
    // ============================================

    event SponsorshipGranted(
        address indexed sender,
        address indexed token,
        uint256 tokenAmount,
        uint256 gasEstimate
    );

    event SponsorshipRejected(
        address indexed sender,
        string reason
    );

    event TokenPriceUpdated(
        address indexed token,
        uint256 newPrice
    );

    event TokenAdded(
        address indexed token,
        uint256 price,
        uint256 minBalance
    );

    event TokenRemoved(
        address indexed token
    );

    event DailySpendLimitUpdated(
        uint256 newLimit
    );

    event DepositReceived(
        address indexed from,
        uint256 amount
    );

    event WithdrawalExecuted(
        address indexed to,
        uint256 amount
    );

    event EmergencyPaused(
        address indexed admin
    );

    event EmergencyUnpaused(
        address indexed admin
    );

    // ============================================
    // Errors
    // ============================================

    error UnsupportedToken(address token);
    error SponsorshipDenied(string reason);
    error ExceededSpendLimit(uint256 requested, uint256 limit);
    error InsufficientTokenBalance(address token, uint256 required, uint256 actual);
    error InvalidPrice(uint256 price);
    error InvalidEntryPoint(address entryPoint);
    error Paused();
    error Unauthorized();
    error InsufficientDeposit(uint256 required, uint256 actual);
    error TransferFailed();

    // ============================================
    // Modifiers
    // ============================================

    modifier onlyEntryPoint() {
        if (msg.sender != entryPoint) revert Unauthorized();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    // ============================================
    // Initializer
    // ============================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the Paymaster
     * @param _entryPoint EntryPoint address
     * @param _admin Admin address
     * @param _dailySpendLimit Daily spend limit in ETH (wei)
     */
    function initialize(
        address _entryPoint,
        address _admin,
        uint256 _dailySpendLimit
    ) external initializer {
        if (_entryPoint == address(0)) revert InvalidEntryPoint(_entryPoint);

        __UUPSUpgradeable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();

        entryPoint = _entryPoint;
        dailySpendLimit = _dailySpendLimit;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }

    // ============================================
    // ERC-4337 Paymaster Interface
    // ============================================

    /**
     * @notice Validate paymaster user operation
     * @dev Called by EntryPoint to validate if paymaster will sponsor the operation
     * @param userOp User operation to validate
     * @param userOpHash Hash of the user operation
     * @param maxCost Maximum cost of the operation
     * @return context Context data for postOp
     * @return validationData Validation result (0 = success)
     */
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    )
        external
        whenNotPaused
        onlyEntryPoint
        returns (bytes memory context, uint256 validationData)
    {
        // Decode paymaster data: [token address (20 bytes), max token amount (32 bytes)]
        if (userOp.paymasterAndData.length < 52) {
            emit SponsorshipRejected(userOp.sender, "Invalid paymaster data");
            return ("", 1); // Validation failed
        }

        address token = address(bytes20(userOp.paymasterAndData[20:40]));
        uint256 maxTokenAmount = uint256(bytes32(userOp.paymasterAndData[40:72]));

        // Check if token is supported
        if (!supportedTokens[token]) {
            emit SponsorshipRejected(userOp.sender, "Unsupported token");
            return ("", 1);
        }

        // Check token price
        uint256 tokenPrice = tokenPrices[token];
        if (tokenPrice == 0) {
            emit SponsorshipRejected(userOp.sender, "Token price not set");
            return ("", 1);
        }

        // Calculate required token amount
        // tokenAmount = (maxCost * tokenPrice) / 1e18
        uint256 requiredTokenAmount = (maxCost * tokenPrice) / 1e18;

        // Check if user provided enough max token amount
        if (maxTokenAmount < requiredTokenAmount) {
            emit SponsorshipRejected(userOp.sender, "Insufficient max token amount");
            return ("", 1);
        }

        // Check user's token balance
        uint256 userBalance = IERC20(token).balanceOf(userOp.sender);
        if (userBalance < requiredTokenAmount) {
            emit SponsorshipRejected(userOp.sender, "Insufficient token balance");
            return ("", 1);
        }

        // Check minimum token balance requirement
        uint256 minBalance = minTokenBalance[token];
        if (userBalance < minBalance) {
            emit SponsorshipRejected(userOp.sender, "Below minimum balance");
            return ("", 1);
        }

        // Check daily spend limit
        uint256 currentDay = block.timestamp / 1 days;
        DailySpend storage spend = dailySpends[userOp.sender];

        // Reset daily spend if new day
        if (spend.lastResetDay < currentDay) {
            spend.amount = 0;
            spend.lastResetDay = currentDay;
        }

        // Check if adding this operation exceeds daily limit
        if (spend.amount + maxCost > dailySpendLimit) {
            emit SponsorshipRejected(userOp.sender, "Daily spend limit exceeded");
            return ("", 1);
        }

        // Check paymaster deposit balance
        if (depositBalance < maxCost) {
            emit SponsorshipRejected(userOp.sender, "Insufficient paymaster deposit");
            return ("", 1);
        }

        // Update daily spend
        spend.amount += maxCost;

        // Emit sponsorship granted event
        emit SponsorshipGranted(userOp.sender, token, requiredTokenAmount, maxCost);

        // Encode context: [token address, required token amount, sender]
        context = abi.encode(token, requiredTokenAmount, userOp.sender);

        // Return success
        return (context, 0);
    }

    /**
     * @notice Post operation handler
     * @dev Called by EntryPoint after user operation execution
     * @param mode Post-op mode (0 = opSucceeded, 1 = opReverted, 2 = postOpReverted)
     * @param context Context data from validatePaymasterUserOp
     * @param actualGasCost Actual gas cost of the operation
     */
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external onlyEntryPoint nonReentrant {
        // Decode context
        (address token, uint256 requiredTokenAmount, address sender) = abi.decode(
            context,
            (address, uint256, address)
        );

        // Calculate actual token amount needed
        uint256 tokenPrice = tokenPrices[token];
        uint256 actualTokenAmount = (actualGasCost * tokenPrice) / 1e18;

        // Ensure we don't charge more than the max
        if (actualTokenAmount > requiredTokenAmount) {
            actualTokenAmount = requiredTokenAmount;
        }

        // Transfer tokens from user to paymaster
        IERC20(token).safeTransferFrom(sender, address(this), actualTokenAmount);

        // Update deposit balance
        depositBalance -= actualGasCost;
    }

    // ============================================
    // Admin Functions
    // ============================================

    /**
     * @notice Add supported token
     * @param token Token address
     * @param price Token price (token per ETH, 18 decimals)
     * @param minBalance Minimum token balance required
     */
    function addToken(
        address token,
        uint256 price,
        uint256 minBalance
    ) external onlyRole(ADMIN_ROLE) {
        if (price == 0) revert InvalidPrice(price);

        supportedTokens[token] = true;
        tokenPrices[token] = price;
        minTokenBalance[token] = minBalance;

        emit TokenAdded(token, price, minBalance);
    }

    /**
     * @notice Remove supported token
     * @param token Token address
     */
    function removeToken(address token) external onlyRole(ADMIN_ROLE) {
        supportedTokens[token] = false;
        delete tokenPrices[token];
        delete minTokenBalance[token];

        emit TokenRemoved(token);
    }

    /**
     * @notice Update token price
     * @param token Token address
     * @param newPrice New price (token per ETH, 18 decimals)
     */
    function updateTokenPrice(
        address token,
        uint256 newPrice
    ) external onlyRole(ORACLE_ROLE) {
        if (!supportedTokens[token]) revert UnsupportedToken(token);
        if (newPrice == 0) revert InvalidPrice(newPrice);

        tokenPrices[token] = newPrice;

        emit TokenPriceUpdated(token, newPrice);
    }

    /**
     * @notice Update daily spend limit
     * @param newLimit New daily spend limit (ETH wei)
     */
    function updateDailySpendLimit(
        uint256 newLimit
    ) external onlyRole(ADMIN_ROLE) {
        dailySpendLimit = newLimit;

        emit DailySpendLimitUpdated(newLimit);
    }

    /**
     * @notice Deposit ETH to EntryPoint
     * @dev Paymaster needs to maintain deposit in EntryPoint for sponsorship
     */
    function depositToEntryPoint() external payable onlyRole(ADMIN_ROLE) {
        depositBalance += msg.value;

        // Transfer to EntryPoint
        (bool success, ) = entryPoint.call{value: msg.value}("");
        if (!success) revert TransferFailed();

        emit DepositReceived(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw from EntryPoint
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawFromEntryPoint(
        address payable to,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) {
        if (depositBalance < amount) {
            revert InsufficientDeposit(amount, depositBalance);
        }

        depositBalance -= amount;

        // Call EntryPoint withdraw
        // Note: Actual EntryPoint interface would be used here
        // For now, simplified implementation

        emit WithdrawalExecuted(to, amount);
    }

    /**
     * @notice Withdraw collected tokens
     * @param token Token address
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawToken(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) {
        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @notice Emergency pause
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        paused = true;
        emit EmergencyPaused(msg.sender);
    }

    /**
     * @notice Unpause
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        paused = false;
        emit EmergencyUnpaused(msg.sender);
    }

    // ============================================
    // View Functions
    // ============================================

    /**
     * @notice Check if sponsorship is available for user
     * @param user User address
     * @param token Token address
     * @param estimatedCost Estimated gas cost
     * @return available True if sponsorship is available
     * @return reason Reason if not available
     */
    function checkSponsorshipEligibility(
        address user,
        address token,
        uint256 estimatedCost
    ) external view returns (bool available, string memory reason) {
        if (paused) {
            return (false, "Paymaster paused");
        }

        if (!supportedTokens[token]) {
            return (false, "Unsupported token");
        }

        uint256 tokenPrice = tokenPrices[token];
        if (tokenPrice == 0) {
            return (false, "Token price not set");
        }

        uint256 requiredTokenAmount = (estimatedCost * tokenPrice) / 1e18;
        uint256 userBalance = IERC20(token).balanceOf(user);

        if (userBalance < requiredTokenAmount) {
            return (false, "Insufficient token balance");
        }

        if (userBalance < minTokenBalance[token]) {
            return (false, "Below minimum balance");
        }

        uint256 currentDay = block.timestamp / 1 days;
        DailySpend memory spend = dailySpends[user];
        uint256 dailyAmount = spend.lastResetDay == currentDay ? spend.amount : 0;

        if (dailyAmount + estimatedCost > dailySpendLimit) {
            return (false, "Daily spend limit exceeded");
        }

        if (depositBalance < estimatedCost) {
            return (false, "Insufficient paymaster deposit");
        }

        return (true, "");
    }

    /**
     * @notice Get user's remaining daily budget
     * @param user User address
     * @return remaining Remaining daily budget (ETH wei)
     */
    function getRemainingDailyBudget(
        address user
    ) external view returns (uint256 remaining) {
        uint256 currentDay = block.timestamp / 1 days;
        DailySpend memory spend = dailySpends[user];

        if (spend.lastResetDay < currentDay) {
            return dailySpendLimit;
        }

        if (spend.amount >= dailySpendLimit) {
            return 0;
        }

        return dailySpendLimit - spend.amount;
    }

    // ============================================
    // UUPS Upgrade
    // ============================================

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(ADMIN_ROLE) {}

    // ============================================
    // Receive ETH
    // ============================================

    receive() external payable {
        emit DepositReceived(msg.sender, msg.value);
    }
}

// ============================================
// ERC-4337 Types
// ============================================

/**
 * @notice User operation struct (ERC-4337)
 */
struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

/**
 * @notice Post operation mode
 */
enum PostOpMode {
    opSucceeded,
    opReverted,
    postOpReverted
}
