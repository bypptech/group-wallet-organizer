// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title PolicyManager
 * @notice Family Wallet のポリシー管理コントラクト
 * @dev エスクロー承認ルール、金額制限、タイムロックを管理
 */
contract PolicyManager is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    /// @notice ロールの定義
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    /// @notice ポリシー構造体
    struct Policy {
        uint256 id;                     // ポリシーID
        address vaultAddress;           // 対象Vaultアドレス
        uint256 minApprovals;           // 最小承認数
        uint256 maxAmount;              // 最大金額（トークンの最小単位）
        uint256 cooldownPeriod;         // クールダウン期間（秒）
        bytes32 rolesRoot;              // ロールMerkle Root
        bytes32 ownersRoot;             // オーナーMerkle Root
        bool enabled;                   // 有効フラグ
        uint256 createdAt;              // 作成日時
        uint256 updatedAt;              // 更新日時
    }

    /// @notice ポリシー更新提案の構造体
    struct PolicyUpdateProposal {
        uint256 policyId;               // 対象ポリシーID
        Policy proposedPolicy;          // 提案されたポリシー
        address proposer;               // 提案者
        uint256 proposedAt;             // 提案日時
        uint256 approvalCount;          // 承認数
        mapping(address => bool) approvals; // 承認状態
        bool executed;                  // 実行済みフラグ
    }

    /// @notice ポリシーカウンター
    uint256 private _policyCounter;

    /// @notice 提案カウンター
    uint256 private _proposalCounter;

    /// @notice ポリシーマッピング
    mapping(uint256 => Policy) private _policies;

    /// @notice Vault別のポリシーIDリスト
    mapping(address => uint256[]) private _vaultPolicies;

    /// @notice ポリシー更新提案マッピング
    mapping(uint256 => PolicyUpdateProposal) private _proposals;

    /// @notice イベント定義
    event PolicyCreated(
        uint256 indexed policyId,
        address indexed vaultAddress,
        uint256 minApprovals,
        uint256 maxAmount,
        uint256 cooldownPeriod
    );

    event PolicyUpdated(
        uint256 indexed policyId,
        address indexed updatedBy,
        uint256 minApprovals,
        uint256 maxAmount,
        uint256 cooldownPeriod
    );

    event PolicyUpdateProposed(
        uint256 indexed proposalId,
        uint256 indexed policyId,
        address indexed proposer
    );

    event PolicyUpdateApproved(
        uint256 indexed proposalId,
        address indexed approver,
        uint256 approvalCount
    );

    event PolicyUpdateExecuted(
        uint256 indexed proposalId,
        uint256 indexed policyId
    );

    event PolicyEnabled(uint256 indexed policyId);
    event PolicyDisabled(uint256 indexed policyId);

    event EmergencyPolicyUpdate(
        uint256 indexed policyId,
        address indexed guardian,
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
    }

    /**
     * @notice 新しいポリシーを作成
     * @param vaultAddress 対象Vaultアドレス
     * @param minApprovals 最小承認数
     * @param maxAmount 最大金額
     * @param cooldownPeriod クールダウン期間（秒）
     * @param rolesRoot ロールMerkle Root
     * @param ownersRoot オーナーMerkle Root
     * @return policyId 作成されたポリシーID
     */
    function createPolicy(
        address vaultAddress,
        uint256 minApprovals,
        uint256 maxAmount,
        uint256 cooldownPeriod,
        bytes32 rolesRoot,
        bytes32 ownersRoot
    ) external onlyRole(ADMIN_ROLE) returns (uint256 policyId) {
        require(vaultAddress != address(0), "Invalid vault address");
        require(minApprovals > 0, "Min approvals must be greater than 0");
        require(maxAmount > 0, "Max amount must be greater than 0");

        policyId = ++_policyCounter;

        Policy storage policy = _policies[policyId];
        policy.id = policyId;
        policy.vaultAddress = vaultAddress;
        policy.minApprovals = minApprovals;
        policy.maxAmount = maxAmount;
        policy.cooldownPeriod = cooldownPeriod;
        policy.rolesRoot = rolesRoot;
        policy.ownersRoot = ownersRoot;
        policy.enabled = true;
        policy.createdAt = block.timestamp;
        policy.updatedAt = block.timestamp;

        _vaultPolicies[vaultAddress].push(policyId);

        emit PolicyCreated(
            policyId,
            vaultAddress,
            minApprovals,
            maxAmount,
            cooldownPeriod
        );
    }

    /**
     * @notice ポリシー更新を提案
     * @param policyId 対象ポリシーID
     * @param minApprovals 新しい最小承認数
     * @param maxAmount 新しい最大金額
     * @param cooldownPeriod 新しいクールダウン期間
     * @param rolesRoot 新しいロールMerkle Root
     * @param ownersRoot 新しいオーナーMerkle Root
     * @return proposalId 提案ID
     */
    function proposeUpdatePolicy(
        uint256 policyId,
        uint256 minApprovals,
        uint256 maxAmount,
        uint256 cooldownPeriod,
        bytes32 rolesRoot,
        bytes32 ownersRoot
    ) external returns (uint256 proposalId) {
        require(_policies[policyId].id != 0, "Policy does not exist");
        require(_policies[policyId].enabled, "Policy is disabled");

        proposalId = ++_proposalCounter;

        PolicyUpdateProposal storage proposal = _proposals[proposalId];
        proposal.policyId = policyId;
        proposal.proposer = msg.sender;
        proposal.proposedAt = block.timestamp;
        proposal.executed = false;

        // 提案されたポリシー情報を設定
        Policy storage proposedPolicy = proposal.proposedPolicy;
        proposedPolicy.id = policyId;
        proposedPolicy.vaultAddress = _policies[policyId].vaultAddress;
        proposedPolicy.minApprovals = minApprovals;
        proposedPolicy.maxAmount = maxAmount;
        proposedPolicy.cooldownPeriod = cooldownPeriod;
        proposedPolicy.rolesRoot = rolesRoot;
        proposedPolicy.ownersRoot = ownersRoot;
        proposedPolicy.enabled = true;

        emit PolicyUpdateProposed(proposalId, policyId, msg.sender);
    }

    /**
     * @notice ポリシー更新提案を承認
     * @param proposalId 提案ID
     */
    function approvePolicyUpdate(uint256 proposalId) external {
        PolicyUpdateProposal storage proposal = _proposals[proposalId];
        require(proposal.policyId != 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.approvals[msg.sender], "Already approved");

        proposal.approvals[msg.sender] = true;
        proposal.approvalCount++;

        emit PolicyUpdateApproved(proposalId, msg.sender, proposal.approvalCount);

        // 必要な承認数に達したら自動実行
        Policy storage currentPolicy = _policies[proposal.policyId];
        if (proposal.approvalCount >= currentPolicy.minApprovals) {
            _executePolicyUpdate(proposalId);
        }
    }

    /**
     * @notice ポリシー更新を実行（内部関数）
     * @param proposalId 提案ID
     */
    function _executePolicyUpdate(uint256 proposalId) internal {
        PolicyUpdateProposal storage proposal = _proposals[proposalId];
        require(!proposal.executed, "Proposal already executed");

        Policy storage currentPolicy = _policies[proposal.policyId];
        Policy storage proposedPolicy = proposal.proposedPolicy;

        currentPolicy.minApprovals = proposedPolicy.minApprovals;
        currentPolicy.maxAmount = proposedPolicy.maxAmount;
        currentPolicy.cooldownPeriod = proposedPolicy.cooldownPeriod;
        currentPolicy.rolesRoot = proposedPolicy.rolesRoot;
        currentPolicy.ownersRoot = proposedPolicy.ownersRoot;
        currentPolicy.updatedAt = block.timestamp;

        proposal.executed = true;

        emit PolicyUpdateExecuted(proposalId, proposal.policyId);
        emit PolicyUpdated(
            proposal.policyId,
            proposal.proposer,
            proposedPolicy.minApprovals,
            proposedPolicy.maxAmount,
            proposedPolicy.cooldownPeriod
        );
    }

    /**
     * @notice Guardian による緊急ポリシー更新
     * @param policyId 対象ポリシーID
     * @param minApprovals 新しい最小承認数
     * @param maxAmount 新しい最大金額
     * @param cooldownPeriod 新しいクールダウン期間
     * @param reason 理由
     */
    function emergencyUpdatePolicy(
        uint256 policyId,
        uint256 minApprovals,
        uint256 maxAmount,
        uint256 cooldownPeriod,
        string calldata reason
    ) external onlyRole(GUARDIAN_ROLE) {
        require(_policies[policyId].id != 0, "Policy does not exist");

        Policy storage policy = _policies[policyId];
        policy.minApprovals = minApprovals;
        policy.maxAmount = maxAmount;
        policy.cooldownPeriod = cooldownPeriod;
        policy.updatedAt = block.timestamp;

        emit EmergencyPolicyUpdate(policyId, msg.sender, reason);
        emit PolicyUpdated(
            policyId,
            msg.sender,
            minApprovals,
            maxAmount,
            cooldownPeriod
        );
    }

    /**
     * @notice ポリシーを有効化
     * @param policyId ポリシーID
     */
    function enablePolicy(uint256 policyId) external onlyRole(ADMIN_ROLE) {
        require(_policies[policyId].id != 0, "Policy does not exist");
        _policies[policyId].enabled = true;
        emit PolicyEnabled(policyId);
    }

    /**
     * @notice ポリシーを無効化
     * @param policyId ポリシーID
     */
    function disablePolicy(uint256 policyId) external onlyRole(ADMIN_ROLE) {
        require(_policies[policyId].id != 0, "Policy does not exist");
        _policies[policyId].enabled = false;
        emit PolicyDisabled(policyId);
    }

    /**
     * @notice ポリシー情報を取得
     * @param policyId ポリシーID
     * @return policy ポリシー情報
     */
    function getPolicy(uint256 policyId) external view returns (Policy memory policy) {
        require(_policies[policyId].id != 0, "Policy does not exist");
        return _policies[policyId];
    }

    /**
     * @notice Vault別のポリシー一覧を取得
     * @param vaultAddress Vaultアドレス
     * @return policyIds ポリシーIDの配列
     */
    function getPoliciesByVault(address vaultAddress)
        external
        view
        returns (uint256[] memory policyIds)
    {
        return _vaultPolicies[vaultAddress];
    }

    /**
     * @notice 提案情報を取得
     * @param proposalId 提案ID
     * @return policyId 対象ポリシーID
     * @return proposer 提案者
     * @return approvalCount 承認数
     * @return executed 実行済みフラグ
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (
            uint256 policyId,
            address proposer,
            uint256 approvalCount,
            bool executed
        )
    {
        PolicyUpdateProposal storage proposal = _proposals[proposalId];
        return (
            proposal.policyId,
            proposal.proposer,
            proposal.approvalCount,
            proposal.executed
        );
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
}
