// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title EscrowExecutor
 * @notice Policy as Oracle Pattern に基づく Escrow 実行コントラクト
 * @dev Policy 検証は Off-chain で実施、On-chain は実行のみを担当
 *
 * アーキテクチャ:
 * - Policy = Off-chain 検証ルール（Oracle 的役割）
 * - Escrow = On-chain 実行 + Off-chain 進捗管理
 * - API サーバーが Policy を参照して検証
 * - ガスコスト削減のため最小限の情報のみ On-chain に保存
 */
contract EscrowExecutor is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    /// @notice エスクロー状態の定義
    enum EscrowState {
        REGISTERED,  // On-chain 登録済み（Off-chain で approved 状態から遷移）
        EXECUTED,    // 実行済み（資金リリース完了）
        CANCELLED    // キャンセル済み
    }

    /// @notice On-chain Escrow データ（最小限の情報のみ）
    struct OnChainEscrow {
        bytes32 escrowHash;        // Off-chain データのハッシュ（検証用）
        address vaultAddress;      // Vault アドレス
        address recipient;         // 受取人アドレス
        address tokenAddress;      // トークンアドレス（address(0) = ETH）
        uint256 amount;            // 金額
        bytes32 policyRoot;        // Policy の Merkle Root（検証用）
        EscrowState state;         // 現在の状態
        uint256 registeredAt;      // 登録日時
        uint256 executedAt;        // 実行日時
        uint256 scheduledReleaseAt; // リリース予定日時
    }

    /// @notice Policy 検証データ
    struct PolicyValidation {
        bytes32 policyId;          // Policy ID（Off-chain UUID のハッシュ）
        bytes32 rolesRoot;         // Guardian ロールの Merkle Root
        uint256 threshold;         // 必要な承認数
        uint256 maxAmount;         // 最大金額
    }

    /// @notice ロールの定義
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    /// @notice Escrow カウンター
    uint256 private _escrowCounter;

    /// @notice On-chain Escrow データ
    mapping(uint256 => OnChainEscrow) private _escrows;

    /// @notice Off-chain Escrow ID → On-chain Escrow ID マッピング
    mapping(bytes32 => uint256) private _offChainToOnChain;

    /// @notice Vault 別の Escrow ID リスト
    mapping(address => uint256[]) private _vaultEscrows;

    /// @notice イベント定義
    event EscrowRegistered(
        uint256 indexed onChainId,
        bytes32 indexed offChainId,
        address indexed vaultAddress,
        address recipient,
        address tokenAddress,
        uint256 amount,
        bytes32 policyRoot
    );

    event EscrowExecuted(
        uint256 indexed onChainId,
        bytes32 indexed offChainId,
        address indexed recipient,
        address tokenAddress,
        uint256 amount
    );

    event EscrowCancelled(
        uint256 indexed onChainId,
        bytes32 indexed offChainId,
        address indexed cancelledBy,
        string reason
    );

    event PolicyValidationVerified(
        uint256 indexed onChainId,
        bytes32 indexed policyId,
        bytes32 rolesRoot,
        uint256 threshold
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice コントラクトの初期化
     * @param admin 管理者アドレス
     */
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(EXECUTOR_ROLE, admin);

        _escrowCounter = 1;
    }

    /**
     * @notice Escrow を On-chain に登録
     * @dev Off-chain で approved 状態になった Escrow のみ登録可能
     * @param offChainId Off-chain Escrow ID（UUID のハッシュ）
     * @param vaultAddress Vault アドレス
     * @param recipient 受取人アドレス
     * @param tokenAddress トークンアドレス
     * @param amount 金額
     * @param scheduledReleaseAt リリース予定日時
     * @param policyValidation Policy 検証データ
     * @param escrowDataHash Off-chain データ全体のハッシュ
     * @return onChainId On-chain Escrow ID
     */
    function registerEscrow(
        bytes32 offChainId,
        address vaultAddress,
        address recipient,
        address tokenAddress,
        uint256 amount,
        uint256 scheduledReleaseAt,
        PolicyValidation calldata policyValidation,
        bytes32 escrowDataHash
    ) external onlyRole(EXECUTOR_ROLE) returns (uint256 onChainId) {
        require(vaultAddress != address(0), "Invalid vault address");
        require(recipient != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        require(_offChainToOnChain[offChainId] == 0, "Escrow already registered");
        require(
            scheduledReleaseAt >= block.timestamp,
            "Scheduled release must be in the future"
        );

        // Policy 検証データの基本チェック
        require(policyValidation.threshold > 0, "Invalid threshold");
        require(policyValidation.maxAmount > 0, "Invalid max amount");
        require(amount <= policyValidation.maxAmount, "Amount exceeds policy limit");

        onChainId = _escrowCounter++;

        OnChainEscrow storage escrow = _escrows[onChainId];
        escrow.escrowHash = escrowDataHash;
        escrow.vaultAddress = vaultAddress;
        escrow.recipient = recipient;
        escrow.tokenAddress = tokenAddress;
        escrow.amount = amount;
        escrow.policyRoot = policyValidation.rolesRoot;
        escrow.state = EscrowState.REGISTERED;
        escrow.registeredAt = block.timestamp;
        escrow.scheduledReleaseAt = scheduledReleaseAt;

        _offChainToOnChain[offChainId] = onChainId;
        _vaultEscrows[vaultAddress].push(onChainId);

        emit EscrowRegistered(
            onChainId,
            offChainId,
            vaultAddress,
            recipient,
            tokenAddress,
            amount,
            policyValidation.rolesRoot
        );

        emit PolicyValidationVerified(
            onChainId,
            policyValidation.policyId,
            policyValidation.rolesRoot,
            policyValidation.threshold
        );

        return onChainId;
    }

    /**
     * @notice Escrow を実行（資金リリース）
     * @dev EXECUTOR_ROLE のみ実行可能（API サーバーから呼び出される）
     * @param onChainId On-chain Escrow ID
     */
    function executeEscrow(uint256 onChainId)
        external
        onlyRole(EXECUTOR_ROLE)
        nonReentrant
    {
        OnChainEscrow storage escrow = _escrows[onChainId];
        require(escrow.registeredAt != 0, "Escrow does not exist");
        require(escrow.state == EscrowState.REGISTERED, "Escrow is not in registered state");
        require(
            block.timestamp >= escrow.scheduledReleaseAt,
            "Escrow is not ready for release yet"
        );

        // 状態を EXECUTED に更新
        escrow.state = EscrowState.EXECUTED;
        escrow.executedAt = block.timestamp;

        // 資金を転送
        if (escrow.tokenAddress == address(0)) {
            // ETH の場合
            (bool success, ) = escrow.recipient.call{value: escrow.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 の場合
            IERC20(escrow.tokenAddress).safeTransferFrom(
                escrow.vaultAddress,
                escrow.recipient,
                escrow.amount
            );
        }

        bytes32 offChainId = _getOffChainId(onChainId);

        emit EscrowExecuted(
            onChainId,
            offChainId,
            escrow.recipient,
            escrow.tokenAddress,
            escrow.amount
        );
    }

    /**
     * @notice Escrow をキャンセル
     * @param onChainId On-chain Escrow ID
     * @param reason キャンセル理由
     */
    function cancelEscrow(uint256 onChainId, string calldata reason)
        external
        onlyRole(EXECUTOR_ROLE)
    {
        OnChainEscrow storage escrow = _escrows[onChainId];
        require(escrow.registeredAt != 0, "Escrow does not exist");
        require(
            escrow.state == EscrowState.REGISTERED,
            "Cannot cancel escrow in current state"
        );

        escrow.state = EscrowState.CANCELLED;

        bytes32 offChainId = _getOffChainId(onChainId);

        emit EscrowCancelled(onChainId, offChainId, msg.sender, reason);
    }

    /**
     * @notice On-chain Escrow 情報を取得
     * @param onChainId On-chain Escrow ID
     * @return escrow Escrow 情報
     */
    function getEscrow(uint256 onChainId)
        external
        view
        returns (OnChainEscrow memory escrow)
    {
        require(_escrows[onChainId].registeredAt != 0, "Escrow does not exist");
        return _escrows[onChainId];
    }

    /**
     * @notice Off-chain ID から On-chain ID を取得
     * @param offChainId Off-chain Escrow ID
     * @return onChainId On-chain Escrow ID
     */
    function getOnChainId(bytes32 offChainId)
        external
        view
        returns (uint256 onChainId)
    {
        onChainId = _offChainToOnChain[offChainId];
        require(onChainId != 0, "Escrow not registered on-chain");
        return onChainId;
    }

    /**
     * @notice Vault 別の Escrow ID 一覧を取得
     * @param vaultAddress Vault アドレス
     * @return escrowIds Escrow ID の配列
     */
    function getVaultEscrows(address vaultAddress)
        external
        view
        returns (uint256[] memory escrowIds)
    {
        return _vaultEscrows[vaultAddress];
    }

    /**
     * @notice 現在の Escrow カウンターを取得
     * @return counter 現在のカウンター値
     */
    function getEscrowCounter() external view returns (uint256 counter) {
        return _escrowCounter;
    }

    /**
     * @notice Escrow データの整合性を検証
     * @param onChainId On-chain Escrow ID
     * @param offChainDataHash Off-chain データのハッシュ
     * @return valid 検証結果
     */
    function verifyEscrowIntegrity(uint256 onChainId, bytes32 offChainDataHash)
        external
        view
        returns (bool valid)
    {
        OnChainEscrow storage escrow = _escrows[onChainId];
        require(escrow.registeredAt != 0, "Escrow does not exist");
        return escrow.escrowHash == offChainDataHash;
    }

    /**
     * @notice On-chain ID から Off-chain ID を逆引き（内部関数）
     * @dev 効率化のため、イベントログから取得する想定
     * @param onChainId On-chain Escrow ID
     * @return offChainId Off-chain Escrow ID
     */
    function _getOffChainId(uint256 onChainId)
        internal
        view
        returns (bytes32 offChainId)
    {
        // TODO: イベントログから取得する実装
        // 現在は placeholder として bytes32(0) を返す
        return bytes32(onChainId);
    }

    /**
     * @notice アップグレード権限の検証
     * @param newImplementation 新しい実装アドレス
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(ADMIN_ROLE)
    {}

    /**
     * @notice ETH を受け取るための receive 関数
     */
    receive() external payable {}
}
