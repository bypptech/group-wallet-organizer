// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title GuardianModule
 * @notice ファミリーウォレットの緊急対応・リカバリ機能を管理
 * @dev Guardian役割による緊急操作、アカウントリカバリフローを提供
 *
 * ## 主要機能
 * - アカウントリカバリ（紛失・盗難時のアカウント再発行）
 * - 緊急凍結（不正利用検知時の即時停止）
 * - ポリシー緊急更新（セキュリティインシデント対応）
 * - Guardian管理（追加・削除・閾値変更）
 *
 * ## セキュリティ
 * - UUPS Upgradeable Pattern
 * - ReentrancyGuard
 * - 二段階リカバリフロー（タイムロック）
 * - Guardian署名による多重承認
 */
contract GuardianModule is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    // ============================================
    // Roles
    // ============================================
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    // ============================================
    // Constants
    // ============================================

    /// @notice リカバリタイムロック期間（デフォルト: 3日）
    uint256 public constant DEFAULT_RECOVERY_TIMELOCK = 3 days;

    /// @notice 緊急凍結の最大期間（デフォルト: 30日）
    uint256 public constant MAX_FREEZE_DURATION = 30 days;

    // ============================================
    // Storage
    // ============================================

    /// @notice EscrowRegistry address
    address public escrowRegistry;

    /// @notice PolicyManager address
    address public policyManager;

    /// @notice リカバリタイムロック期間
    uint256 public recoveryTimelock;

    /// @notice Guardian閾値（リカバリ承認に必要な署名数）
    uint256 public guardianThreshold;

    /// @notice Guardianアドレスリスト
    address[] public guardians;

    /// @notice Guardian存在チェック用マッピング
    mapping(address => bool) public isGuardian;

    /// @notice リカバリ要求マッピング (requestId => RecoveryRequest)
    mapping(uint256 => RecoveryRequest) public recoveryRequests;

    /// @notice Vaultアドレスからリカバリ要求IDへのマッピング
    mapping(address => uint256) public vaultToRecoveryId;

    /// @notice Vaultごとの凍結状態
    mapping(address => FreezeState) public freezeStates;

    /// @notice リカバリ要求カウンター
    uint256 public recoveryRequestCounter;

    /// @notice リカバリ要求構造体
    struct RecoveryRequest {
        address vaultAddress;
        address oldAccount;
        address newAccount;
        address[] approvers;
        uint256 initiatedAt;
        uint256 executableAt;
        bool executed;
        bool cancelled;
        string reason;
    }

    /// @notice 凍結状態構造体
    struct FreezeState {
        bool frozen;
        uint256 frozenAt;
        uint256 frozenUntil;
        address freezer;
        string reason;
    }

    // ============================================
    // Events
    // ============================================

    event RecoveryInitiated(
        uint256 indexed requestId,
        address indexed vaultAddress,
        address indexed oldAccount,
        address newAccount,
        address initiator,
        string reason
    );

    event RecoveryApproved(
        uint256 indexed requestId,
        address indexed approver
    );

    event RecoveryCompleted(
        uint256 indexed requestId,
        address indexed vaultAddress,
        address oldAccount,
        address newAccount
    );

    event RecoveryCancelled(
        uint256 indexed requestId,
        address indexed canceller
    );

    event EmergencyFreeze(
        address indexed vaultAddress,
        address indexed freezer,
        uint256 duration,
        string reason
    );

    event EmergencyUnfreeze(
        address indexed vaultAddress,
        address indexed unfreezer
    );

    event GuardianAdded(
        address indexed guardian,
        address indexed admin
    );

    event GuardianRemoved(
        address indexed guardian,
        address indexed admin
    );

    event GuardianThresholdUpdated(
        uint256 oldThreshold,
        uint256 newThreshold
    );

    event RecoveryTimelockUpdated(
        uint256 oldTimelock,
        uint256 newTimelock
    );

    event EscrowRegistryUpdated(
        address oldRegistry,
        address newRegistry
    );

    event PolicyManagerUpdated(
        address oldManager,
        address newManager
    );

    // ============================================
    // Errors
    // ============================================

    error InvalidVaultAddress(address vaultAddress);
    error InvalidAccount(address account);
    error RecoveryNotFound(uint256 requestId);
    error RecoveryAlreadyExists(address vaultAddress);
    error RecoveryAlreadyExecuted(uint256 requestId);
    error RecoveryAlreadyCancelled(uint256 requestId);
    error RecoveryNotReady(uint256 requestId, uint256 executableAt);
    error InsufficientApprovals(uint256 current, uint256 required);
    error AlreadyApproved(address approver);
    error NotGuardian(address account);
    error VaultFrozen(address vaultAddress);
    error VaultNotFrozen(address vaultAddress);
    error InvalidThreshold(uint256 threshold);
    error InvalidTimelock(uint256 timelock);
    error GuardianAlreadyExists(address guardian);
    error GuardianNotFound(address guardian);
    error CannotRemoveLastGuardian();

    // ============================================
    // Modifiers
    // ============================================

    modifier onlyGuardian() {
        if (!hasRole(GUARDIAN_ROLE, msg.sender)) revert NotGuardian(msg.sender);
        _;
    }

    modifier vaultNotFrozen(address vaultAddress) {
        if (freezeStates[vaultAddress].frozen) revert VaultFrozen(vaultAddress);
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
     * @notice Initialize the Guardian Module
     * @param _admin Admin address
     * @param _escrowRegistry EscrowRegistry address
     * @param _policyManager PolicyManager address
     * @param _initialGuardians Initial guardian addresses
     * @param _guardianThreshold Guardian threshold
     */
    function initialize(
        address _admin,
        address _escrowRegistry,
        address _policyManager,
        address[] memory _initialGuardians,
        uint256 _guardianThreshold
    ) external initializer {
        if (_admin == address(0)) revert InvalidAccount(_admin);
        if (_guardianThreshold == 0 || _guardianThreshold > _initialGuardians.length) {
            revert InvalidThreshold(_guardianThreshold);
        }

        __UUPSUpgradeable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();

        escrowRegistry = _escrowRegistry;
        policyManager = _policyManager;
        recoveryTimelock = DEFAULT_RECOVERY_TIMELOCK;
        guardianThreshold = _guardianThreshold;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);

        // Add initial guardians
        for (uint256 i = 0; i < _initialGuardians.length; i++) {
            address guardian = _initialGuardians[i];
            if (guardian == address(0)) revert InvalidAccount(guardian);

            _grantRole(GUARDIAN_ROLE, guardian);
            guardians.push(guardian);
            isGuardian[guardian] = true;
        }
    }

    // ============================================
    // Recovery Functions
    // ============================================

    /**
     * @notice アカウントリカバリを開始
     * @param vaultAddress Vaultアドレス
     * @param oldAccount 旧アカウントアドレス
     * @param newAccount 新アカウントアドレス
     * @param reason リカバリ理由
     * @return requestId リカバリリクエストID
     */
    function initiateRecovery(
        address vaultAddress,
        address oldAccount,
        address newAccount,
        string calldata reason
    ) external onlyGuardian vaultNotFrozen(vaultAddress) returns (uint256 requestId) {
        if (vaultAddress == address(0)) revert InvalidVaultAddress(vaultAddress);
        if (oldAccount == address(0)) revert InvalidAccount(oldAccount);
        if (newAccount == address(0)) revert InvalidAccount(newAccount);

        // Check if recovery already exists for this vault
        uint256 existingRequestId = vaultToRecoveryId[vaultAddress];
        if (existingRequestId > 0) {
            RecoveryRequest storage existing = recoveryRequests[existingRequestId];
            if (existing.initiatedAt > 0 && !existing.executed && !existing.cancelled) {
                revert RecoveryAlreadyExists(vaultAddress);
            }
        }

        requestId = ++recoveryRequestCounter;
        vaultToRecoveryId[vaultAddress] = requestId;

        RecoveryRequest storage request = recoveryRequests[requestId];
        request.vaultAddress = vaultAddress;
        request.oldAccount = oldAccount;
        request.newAccount = newAccount;
        request.initiatedAt = block.timestamp;
        request.executableAt = block.timestamp + recoveryTimelock;
        request.executed = false;
        request.cancelled = false;
        request.reason = reason;

        // Auto-approve by initiator
        request.approvers.push(msg.sender);

        emit RecoveryInitiated(
            requestId,
            vaultAddress,
            oldAccount,
            newAccount,
            msg.sender,
            reason
        );

        emit RecoveryApproved(requestId, msg.sender);
    }

    /**
     * @notice リカバリ要求を承認
     * @param requestId リクエストID
     */
    function approveRecovery(
        uint256 requestId
    ) external onlyGuardian {
        RecoveryRequest storage request = _getRecoveryRequest(requestId);

        if (request.executed) revert RecoveryAlreadyExecuted(requestId);
        if (request.cancelled) revert RecoveryAlreadyCancelled(requestId);

        // Check if already approved
        for (uint256 i = 0; i < request.approvers.length; i++) {
            if (request.approvers[i] == msg.sender) {
                revert AlreadyApproved(msg.sender);
            }
        }

        request.approvers.push(msg.sender);

        emit RecoveryApproved(requestId, msg.sender);
    }

    /**
     * @notice リカバリを実行
     * @param requestId リクエストID
     */
    function completeRecovery(
        uint256 requestId
    ) external onlyGuardian nonReentrant {
        RecoveryRequest storage request = _getRecoveryRequest(requestId);

        if (request.executed) revert RecoveryAlreadyExecuted(requestId);
        if (request.cancelled) revert RecoveryAlreadyCancelled(requestId);

        // Check timelock
        if (block.timestamp < request.executableAt) {
            revert RecoveryNotReady(requestId, request.executableAt);
        }

        // Check approvals
        if (request.approvers.length < guardianThreshold) {
            revert InsufficientApprovals(request.approvers.length, guardianThreshold);
        }

        request.executed = true;

        // TODO: Call EscrowRegistry to update account
        // This would require EscrowRegistry to have a function to update vault accounts

        emit RecoveryCompleted(
            requestId,
            request.vaultAddress,
            request.oldAccount,
            request.newAccount
        );
    }

    /**
     * @notice リカバリ要求をキャンセル
     * @param requestId リクエストID
     */
    function cancelRecovery(
        uint256 requestId
    ) external onlyGuardian {
        RecoveryRequest storage request = _getRecoveryRequest(requestId);

        if (request.executed) revert RecoveryAlreadyExecuted(requestId);
        if (request.cancelled) revert RecoveryAlreadyCancelled(requestId);

        request.cancelled = true;

        emit RecoveryCancelled(requestId, msg.sender);
    }

    // ============================================
    // Emergency Freeze Functions
    // ============================================

    /**
     * @notice Vaultを緊急凍結
     * @param vaultAddress Vaultアドレス
     * @param duration 凍結期間（秒）
     * @param reason 凍結理由
     */
    function emergencyFreeze(
        address vaultAddress,
        uint256 duration,
        string calldata reason
    ) external onlyGuardian {
        if (vaultAddress == address(0)) revert InvalidVaultAddress(vaultAddress);
        if (duration > MAX_FREEZE_DURATION) {
            revert InvalidTimelock(duration);
        }

        FreezeState storage freeze = freezeStates[vaultAddress];

        freeze.frozen = true;
        freeze.frozenAt = block.timestamp;
        freeze.frozenUntil = block.timestamp + duration;
        freeze.freezer = msg.sender;
        freeze.reason = reason;

        emit EmergencyFreeze(vaultAddress, msg.sender, duration, reason);
    }

    /**
     * @notice Vaultの凍結を解除
     * @param vaultAddress Vaultアドレス
     */
    function emergencyUnfreeze(
        address vaultAddress
    ) external onlyGuardian {
        FreezeState storage freeze = freezeStates[vaultAddress];

        if (!freeze.frozen) revert VaultNotFrozen(vaultAddress);

        freeze.frozen = false;

        emit EmergencyUnfreeze(vaultAddress, msg.sender);
    }

    /**
     * @notice 凍結期間が過ぎた場合に自動解凍
     * @param vaultAddress Vaultアドレス
     */
    function autoUnfreeze(address vaultAddress) external {
        FreezeState storage freeze = freezeStates[vaultAddress];

        if (!freeze.frozen) revert VaultNotFrozen(vaultAddress);
        if (block.timestamp < freeze.frozenUntil) {
            revert RecoveryNotReady(0, freeze.frozenUntil);
        }

        freeze.frozen = false;

        emit EmergencyUnfreeze(vaultAddress, msg.sender);
    }

    // ============================================
    // Guardian Management
    // ============================================

    /**
     * @notice Guardianを追加
     * @param guardian Guardian address
     */
    function addGuardian(address guardian) external onlyRole(ADMIN_ROLE) {
        if (guardian == address(0)) revert InvalidAccount(guardian);
        if (isGuardian[guardian]) revert GuardianAlreadyExists(guardian);

        _grantRole(GUARDIAN_ROLE, guardian);
        guardians.push(guardian);
        isGuardian[guardian] = true;

        emit GuardianAdded(guardian, msg.sender);
    }

    /**
     * @notice Guardianを削除
     * @param guardian Guardian address
     */
    function removeGuardian(address guardian) external onlyRole(ADMIN_ROLE) {
        if (!isGuardian[guardian]) revert GuardianNotFound(guardian);
        if (guardians.length <= guardianThreshold) revert CannotRemoveLastGuardian();

        _revokeRole(GUARDIAN_ROLE, guardian);
        isGuardian[guardian] = false;

        // Remove from array
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == guardian) {
                guardians[i] = guardians[guardians.length - 1];
                guardians.pop();
                break;
            }
        }

        emit GuardianRemoved(guardian, msg.sender);
    }

    /**
     * @notice Guardian閾値を更新
     * @param newThreshold 新しい閾値
     */
    function updateGuardianThreshold(
        uint256 newThreshold
    ) external onlyRole(ADMIN_ROLE) {
        if (newThreshold == 0 || newThreshold > guardians.length) {
            revert InvalidThreshold(newThreshold);
        }

        uint256 oldThreshold = guardianThreshold;
        guardianThreshold = newThreshold;

        emit GuardianThresholdUpdated(oldThreshold, newThreshold);
    }

    // ============================================
    // Configuration Functions
    // ============================================

    /**
     * @notice リカバリタイムロックを更新
     * @param newTimelock 新しいタイムロック期間
     */
    function updateRecoveryTimelock(
        uint256 newTimelock
    ) external onlyRole(ADMIN_ROLE) {
        if (newTimelock == 0) revert InvalidTimelock(newTimelock);

        uint256 oldTimelock = recoveryTimelock;
        recoveryTimelock = newTimelock;

        emit RecoveryTimelockUpdated(oldTimelock, newTimelock);
    }

    /**
     * @notice EscrowRegistryアドレスを更新
     * @param newRegistry 新しいEscrowRegistry address
     */
    function updateEscrowRegistry(
        address newRegistry
    ) external onlyRole(ADMIN_ROLE) {
        if (newRegistry == address(0)) revert InvalidAccount(newRegistry);

        address oldRegistry = escrowRegistry;
        escrowRegistry = newRegistry;

        emit EscrowRegistryUpdated(oldRegistry, newRegistry);
    }

    /**
     * @notice PolicyManagerアドレスを更新
     * @param newManager 新しいPolicyManager address
     */
    function updatePolicyManager(
        address newManager
    ) external onlyRole(ADMIN_ROLE) {
        if (newManager == address(0)) revert InvalidAccount(newManager);

        address oldManager = policyManager;
        policyManager = newManager;

        emit PolicyManagerUpdated(oldManager, newManager);
    }

    // ============================================
    // View Functions
    // ============================================

    /**
     * @notice リカバリ要求を取得
     * @param requestId リクエストID
     * @return request リカバリ要求
     */
    function getRecoveryRequest(
        uint256 requestId
    ) external view returns (RecoveryRequest memory) {
        return _getRecoveryRequest(requestId);
    }

    /**
     * @notice リカバリ承認者リストを取得
     * @param requestId リクエストID
     * @return approvers 承認者リスト
     */
    function getRecoveryApprovers(
        uint256 requestId
    ) external view returns (address[] memory) {
        RecoveryRequest storage request = _getRecoveryRequest(requestId);
        return request.approvers;
    }

    /**
     * @notice 凍結状態を取得
     * @param vaultAddress Vaultアドレス
     * @return freeze 凍結状態
     */
    function getFreezeState(
        address vaultAddress
    ) external view returns (FreezeState memory) {
        return freezeStates[vaultAddress];
    }

    /**
     * @notice Vaultが凍結されているか確認
     * @param vaultAddress Vaultアドレス
     * @return frozen 凍結フラグ
     */
    function isVaultFrozen(address vaultAddress) external view returns (bool) {
        return freezeStates[vaultAddress].frozen;
    }

    /**
     * @notice Guardian一覧を取得
     * @return Guardian addresses
     */
    function getGuardians() external view returns (address[] memory) {
        return guardians;
    }

    /**
     * @notice Guardian数を取得
     * @return Guardian count
     */
    function getGuardianCount() external view returns (uint256) {
        return guardians.length;
    }

    // ============================================
    // Internal Functions
    // ============================================

    function _getRecoveryRequest(
        uint256 requestId
    ) internal view returns (RecoveryRequest storage) {
        RecoveryRequest storage request = recoveryRequests[requestId];
        if (request.vaultAddress == address(0)) {
            revert RecoveryNotFound(requestId);
        }
        return request;
    }

    // ============================================
    // UUPS Upgrade
    // ============================================

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(ADMIN_ROLE) {}
}
