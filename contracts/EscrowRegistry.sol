// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title EscrowRegistry
 * @notice Family Wallet のエスクロー管理コントラクト
 * @dev ERC-4337 Account Abstraction と MultiOwnable パターンに対応
 */
contract EscrowRegistry is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    /// @notice エスクロー状態の定義
    enum EscrowState {
        DRAFT,      // 下書き（未送信）
        PENDING,    // 承認待ち
        APPROVED,   // 承認済み
        READY,      // リリース可能
        RELEASED,   // リリース済み
        CANCELLED,  // キャンセル済み
        EXPIRED     // 期限切れ
    }

    /// @notice エスクロータイプの定義
    enum EscrowType {
        ALLOWANCE,     // お小遣い
        BILL_PAYMENT,  // 請求書支払い
        GIFT,          // ギフト
        REIMBURSEMENT, // 払い戻し
        OTHER          // その他
    }

    /// @notice 承認タイプの定義
    enum ApprovalType {
        ASYNC,  // 非同期（通常の署名）
        SYNC    // 同期（一斉署名）
    }

    /// @notice エスクロー作成パラメータの構造体
    struct CreateEscrowParams {
        address vaultAddress;
        address recipient;
        address tokenAddress;
        uint256 amount;
        EscrowType escrowType;
        ApprovalType approvalType;
        string title;
        string description;
        uint256 scheduledReleaseAt;
        uint256 expiresAt;
        bytes32 metadataHash;
    }

    /// @notice エスクロー情報の構造体
    struct Escrow {
        uint256 id;                  // エスクローID
        address vaultAddress;        // Vaultアドレス（MultiOwnable AA Wallet）
        address requester;           // リクエスター（EOA）
        address recipient;           // 受取人アドレス
        address tokenAddress;        // トークンアドレス（address(0) = ETH）
        uint256 amount;              // 金額
        EscrowType escrowType;       // エスクロータイプ
        ApprovalType approvalType;   // 承認タイプ
        EscrowState state;           // 現在の状態
        string title;                // タイトル
        string description;          // 説明
        uint256 createdAt;           // 作成日時
        uint256 updatedAt;           // 更新日時
        uint256 scheduledReleaseAt;  // リリース予定日時
        uint256 expiresAt;           // 有効期限
        bytes32 metadataHash;        // メタデータのハッシュ（IPFS等）
    }

    /// @notice 承認情報の構造体
    struct ApprovalState {
        uint256 escrowId;            // エスクローID
        uint256 requiredApprovals;   // 必要な承認数
        uint256 currentApprovals;    // 現在の承認数
        mapping(address => bool) hasApproved; // 承認済みガーディアンのマップ
        address[] approvers;         // 承認者のリスト
        uint256 approvalDeadline;    // 承認期限
        bool isTimelockActive;       // タイムロック有効化フラグ
        uint256 timelockUntil;       // タイムロック解除時刻
    }

    /// @notice ロールの定義
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice エスクローカウンター
    uint256 private _escrowCounter;

    /// @notice エスクロー情報のマッピング
    mapping(uint256 => Escrow) private _escrows;

    /// @notice 承認状態のマッピング
    mapping(uint256 => ApprovalState) private _approvalStates;

    /// @notice Vault別のエスクローIDリスト
    mapping(address => uint256[]) private _vaultEscrows;

    /// @notice リクエスター別のエスクローIDリスト
    mapping(address => uint256[]) private _requesterEscrows;

    /// @notice イベント定義
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed vaultAddress,
        address indexed requester,
        address recipient,
        address tokenAddress,
        uint256 amount,
        EscrowType escrowType
    );

    event EscrowStateChanged(
        uint256 indexed escrowId,
        EscrowState previousState,
        EscrowState newState,
        address indexed changedBy
    );

    event ApprovalGranted(
        uint256 indexed escrowId,
        address indexed approver,
        uint256 currentApprovals,
        uint256 requiredApprovals
    );

    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed recipient,
        address tokenAddress,
        uint256 amount
    );

    event EscrowCancelled(
        uint256 indexed escrowId,
        address indexed cancelledBy,
        string reason
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

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _escrowCounter = 1;
    }

    /**
     * @dev アップグレード権限チェック
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(ADMIN_ROLE)
    {}

    /**
     * @notice エスクローを取得
     * @param escrowId エスクローID
     * @return エスクロー情報
     */
    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        require(_escrows[escrowId].id != 0, "Escrow does not exist");
        return _escrows[escrowId];
    }

    /**
     * @notice 承認状態を取得
     * @param escrowId エスクローID
     * @return requiredApprovals 必要な承認数
     * @return currentApprovals 現在の承認数
     * @return approvers 承認者のリスト
     */
    function getApprovalState(uint256 escrowId)
        external
        view
        returns (
            uint256 requiredApprovals,
            uint256 currentApprovals,
            address[] memory approvers
        )
    {
        ApprovalState storage state = _approvalStates[escrowId];
        return (
            state.requiredApprovals,
            state.currentApprovals,
            state.approvers
        );
    }

    /**
     * @notice Vault別のエスクローID一覧を取得
     * @param vaultAddress Vaultアドレス
     * @return エスクローIDの配列
     */
    function getVaultEscrows(address vaultAddress)
        external
        view
        returns (uint256[] memory)
    {
        return _vaultEscrows[vaultAddress];
    }

    /**
     * @notice リクエスター別のエスクローID一覧を取得
     * @param requester リクエスターアドレス
     * @return エスクローIDの配列
     */
    function getRequesterEscrows(address requester)
        external
        view
        returns (uint256[] memory)
    {
        return _requesterEscrows[requester];
    }

    /**
     * @notice 現在のエスクローカウンターを取得
     * @return 現在のカウンター値
     */
    function getEscrowCounter() external view returns (uint256) {
        return _escrowCounter;
    }

    /**
     * @notice エスクローを作成
     * @param params エスクロー作成パラメータ
     * @return escrowId 作成されたエスクローのID
     */
    function createEscrow(CreateEscrowParams calldata params)
        external
        returns (uint256 escrowId)
    {
        require(params.vaultAddress != address(0), "Invalid vault address");
        require(params.recipient != address(0), "Invalid recipient address");
        require(params.amount > 0, "Amount must be greater than 0");
        require(
            params.expiresAt > block.timestamp,
            "Expiry time must be in the future"
        );
        require(
            params.scheduledReleaseAt <= params.expiresAt,
            "Scheduled release must be before expiry"
        );

        escrowId = _escrowCounter++;

        Escrow storage escrow = _escrows[escrowId];
        escrow.id = escrowId;
        escrow.vaultAddress = params.vaultAddress;
        escrow.requester = msg.sender;
        escrow.recipient = params.recipient;
        escrow.tokenAddress = params.tokenAddress;
        escrow.amount = params.amount;
        escrow.escrowType = params.escrowType;
        escrow.approvalType = params.approvalType;
        escrow.state = EscrowState.DRAFT;
        escrow.title = params.title;
        escrow.description = params.description;
        escrow.createdAt = block.timestamp;
        escrow.updatedAt = block.timestamp;
        escrow.scheduledReleaseAt = params.scheduledReleaseAt;
        escrow.expiresAt = params.expiresAt;
        escrow.metadataHash = params.metadataHash;

        _vaultEscrows[params.vaultAddress].push(escrowId);
        _requesterEscrows[msg.sender].push(escrowId);

        emit EscrowCreated(
            escrowId,
            params.vaultAddress,
            msg.sender,
            params.recipient,
            params.tokenAddress,
            params.amount,
            params.escrowType
        );

        return escrowId;
    }

    /**
     * @notice エスクローの状態を変更
     * @param escrowId エスクローID
     * @param newState 新しい状態
     */
    function changeEscrowState(uint256 escrowId, EscrowState newState)
        external
    {
        Escrow storage escrow = _escrows[escrowId];
        require(escrow.id != 0, "Escrow does not exist");

        // 権限チェック: リクエスター、Vault、または管理者のみ
        require(
            msg.sender == escrow.requester ||
            msg.sender == escrow.vaultAddress ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        EscrowState previousState = escrow.state;
        escrow.state = newState;
        escrow.updatedAt = block.timestamp;

        emit EscrowStateChanged(escrowId, previousState, newState, msg.sender);
    }

    /**
     * @notice 承認状態を初期化
     * @param escrowId エスクローID
     * @param requiredApprovals 必要な承認数
     * @param approvalDeadline 承認期限
     */
    function initializeApprovalState(
        uint256 escrowId,
        uint256 requiredApprovals,
        uint256 approvalDeadline
    ) external {
        Escrow storage escrow = _escrows[escrowId];
        require(escrow.id != 0, "Escrow does not exist");
        require(
            msg.sender == escrow.requester ||
            msg.sender == escrow.vaultAddress ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        ApprovalState storage state = _approvalStates[escrowId];
        state.escrowId = escrowId;
        state.requiredApprovals = requiredApprovals;
        state.currentApprovals = 0;
        state.approvalDeadline = approvalDeadline;
        state.isTimelockActive = false;
        state.timelockUntil = 0;
    }

    /**
     * @notice 承認を付与
     * @param escrowId エスクローID
     */
    function approveEscrow(uint256 escrowId) external {
        Escrow storage escrow = _escrows[escrowId];
        require(escrow.id != 0, "Escrow does not exist");
        require(
            escrow.state == EscrowState.PENDING,
            "Escrow is not in pending state"
        );

        ApprovalState storage state = _approvalStates[escrowId];
        require(
            block.timestamp <= state.approvalDeadline,
            "Approval deadline has passed"
        );
        require(!state.hasApproved[msg.sender], "Already approved");

        // 承認を記録
        state.hasApproved[msg.sender] = true;
        state.approvers.push(msg.sender);
        state.currentApprovals++;

        emit ApprovalGranted(
            escrowId,
            msg.sender,
            state.currentApprovals,
            state.requiredApprovals
        );

        // 必要な承認数に達した場合、状態を変更
        if (state.currentApprovals >= state.requiredApprovals) {
            escrow.state = EscrowState.APPROVED;
            escrow.updatedAt = block.timestamp;

            emit EscrowStateChanged(
                escrowId,
                EscrowState.PENDING,
                EscrowState.APPROVED,
                msg.sender
            );
        }
    }

    /**
     * @notice エスクローをキャンセル
     * @param escrowId エスクローID
     * @param reason キャンセル理由
     */
    function cancelEscrow(uint256 escrowId, string calldata reason) external {
        Escrow storage escrow = _escrows[escrowId];
        require(escrow.id != 0, "Escrow does not exist");
        require(
            msg.sender == escrow.requester ||
            msg.sender == escrow.vaultAddress ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        require(
            escrow.state != EscrowState.RELEASED &&
            escrow.state != EscrowState.CANCELLED,
            "Cannot cancel escrow in current state"
        );

        EscrowState previousState = escrow.state;
        escrow.state = EscrowState.CANCELLED;
        escrow.updatedAt = block.timestamp;

        emit EscrowCancelled(escrowId, msg.sender, reason);
        emit EscrowStateChanged(
            escrowId,
            previousState,
            EscrowState.CANCELLED,
            msg.sender
        );
    }
}
