// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title RoleVerifier
 * @notice Merkle Proofを使用したロール検証コントラクト
 * @dev オフチェーンでMerkle Treeを構築し、オンチェーンで効率的にロールを検証
 */
contract RoleVerifier {
    /// @notice ロールの定義
    enum Role {
        NONE,       // 権限なし
        VIEWER,     // 閲覧のみ
        REQUESTER,  // エスクロー作成可能
        GUARDIAN,   // 承認可能
        OWNER       // 全権限
    }

    /// @notice ロール検証結果の構造体
    struct RoleVerification {
        bool isValid;           // 検証が有効かどうか
        Role role;              // 検証されたロール
        address member;         // メンバーアドレス
    }

    /**
     * @notice ロールを検証
     * @param member メンバーアドレス
     * @param role ロール
     * @param rolesRoot ロールMerkle Root
     * @param proof Merkle Proof
     * @return isValid 検証結果
     */
    function verifyRole(
        address member,
        Role role,
        bytes32 rolesRoot,
        bytes32[] calldata proof
    ) public pure returns (bool isValid) {
        // リーフノードを生成（member, role）
        bytes32 leaf = keccak256(abi.encodePacked(member, uint8(role)));

        // Merkle Proofを検証
        return MerkleProof.verify(proof, rolesRoot, leaf);
    }

    /**
     * @notice 複数のロールを一括検証
     * @param members メンバーアドレス配列
     * @param roles ロール配列
     * @param rolesRoot ロールMerkle Root
     * @param proofs Merkle Proof配列
     * @return results 検証結果の配列
     */
    function verifyRoles(
        address[] calldata members,
        Role[] calldata roles,
        bytes32 rolesRoot,
        bytes32[][] calldata proofs
    ) external pure returns (bool[] memory results) {
        require(
            members.length == roles.length && roles.length == proofs.length,
            "Array length mismatch"
        );

        results = new bool[](members.length);

        for (uint256 i = 0; i < members.length; i++) {
            results[i] = verifyRole(members[i], roles[i], rolesRoot, proofs[i]);
        }
    }

    /**
     * @notice オーナー権限を検証
     * @param owner オーナーアドレス
     * @param ownersRoot オーナーMerkle Root
     * @param proof Merkle Proof
     * @return isValid 検証結果
     */
    function verifyOwner(
        address owner,
        bytes32 ownersRoot,
        bytes32[] calldata proof
    ) public pure returns (bool isValid) {
        // リーフノードを生成
        bytes32 leaf = keccak256(abi.encodePacked(owner));

        // Merkle Proofを検証
        return MerkleProof.verify(proof, ownersRoot, leaf);
    }

    /**
     * @notice 複数のオーナーを一括検証
     * @param owners オーナーアドレス配列
     * @param ownersRoot オーナーMerkle Root
     * @param proofs Merkle Proof配列
     * @return results 検証結果の配列
     */
    function verifyOwners(
        address[] calldata owners,
        bytes32 ownersRoot,
        bytes32[][] calldata proofs
    ) external pure returns (bool[] memory results) {
        require(owners.length == proofs.length, "Array length mismatch");

        results = new bool[](owners.length);

        for (uint256 i = 0; i < owners.length; i++) {
            results[i] = verifyOwner(owners[i], ownersRoot, proofs[i]);
        }
    }

    /**
     * @notice ロールが特定の権限を持つかどうかを確認
     * @param role ロール
     * @param requiredRole 必要なロール
     * @return hasPermission 権限の有無
     */
    function hasPermission(Role role, Role requiredRole)
        public
        pure
        returns (bool hasPermission)
    {
        // OWNERは全ての権限を持つ
        if (role == Role.OWNER) {
            return true;
        }

        // 必要なロール以上の権限を持っているかチェック
        return uint8(role) >= uint8(requiredRole);
    }

    /**
     * @notice ロールが承認権限を持つかどうかを確認
     * @param role ロール
     * @return canApprove 承認権限の有無
     */
    function canApprove(Role role) external pure returns (bool canApprove) {
        return hasPermission(role, Role.GUARDIAN);
    }

    /**
     * @notice ロールがエスクロー作成権限を持つかどうかを確認
     * @param role ロール
     * @return canCreate 作成権限の有無
     */
    function canCreateEscrow(Role role) external pure returns (bool canCreate) {
        return hasPermission(role, Role.REQUESTER);
    }

    /**
     * @notice ロールが閲覧権限を持つかどうかを確認
     * @param role ロール
     * @return canView 閲覧権限の有無
     */
    function canView(Role role) external pure returns (bool canView) {
        return hasPermission(role, Role.VIEWER);
    }

    /**
     * @notice リーフノードを生成（ヘルパー関数）
     * @param member メンバーアドレス
     * @param role ロール
     * @return leaf リーフノード
     */
    function generateLeaf(address member, Role role)
        external
        pure
        returns (bytes32 leaf)
    {
        return keccak256(abi.encodePacked(member, uint8(role)));
    }

    /**
     * @notice オーナーのリーフノードを生成（ヘルパー関数）
     * @param owner オーナーアドレス
     * @return leaf リーフノード
     */
    function generateOwnerLeaf(address owner)
        external
        pure
        returns (bytes32 leaf)
    {
        return keccak256(abi.encodePacked(owner));
    }

    /**
     * @notice ロールの文字列表現を取得
     * @param role ロール
     * @return roleName ロール名
     */
    function getRoleName(Role role) external pure returns (string memory roleName) {
        if (role == Role.OWNER) return "OWNER";
        if (role == Role.GUARDIAN) return "GUARDIAN";
        if (role == Role.REQUESTER) return "REQUESTER";
        if (role == Role.VIEWER) return "VIEWER";
        return "NONE";
    }

    /**
     * @notice ロールレベルを取得
     * @param role ロール
     * @return level ロールレベル（数値が大きいほど権限が強い）
     */
    function getRoleLevel(Role role) external pure returns (uint8 level) {
        return uint8(role);
    }
}
