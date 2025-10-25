// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IVault.sol";

/**
 * @title MockVault
 * @notice Mock Vault contract for testing purposes
 * @dev Minimal implementation of IVault for VaultFactory testing
 */
contract MockVault is Initializable, IVault {
    address private _owner;
    string private _name;
    mapping(address => bool) private _members;
    uint256 private _memberCount;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the Vault
     * @param owner_ Initial owner address
     * @param name_ Vault name
     */
    function initialize(address owner_, string calldata name_) external initializer override {
        require(owner_ != address(0), "Invalid owner");
        require(bytes(name_).length > 0, "Empty name");

        _owner = owner_;
        _name = name_;
        _members[owner_] = true;
        _memberCount = 1;

        emit VaultInitialized(owner_, name_);
    }

    /**
     * @notice Get the Vault owner
     * @return Owner address
     */
    function owner() external view override returns (address) {
        return _owner;
    }

    /**
     * @notice Get the Vault name
     * @return Vault name
     */
    function name() external view override returns (string memory) {
        return _name;
    }

    /**
     * @notice Get the Vault address
     * @return Vault contract address
     */
    function getAddress() external view override returns (address) {
        return address(this);
    }

    /**
     * @notice Check if an address is a member of the Vault
     * @param account Address to check
     * @return True if the address is a member
     */
    function isMember(address account) external view override returns (bool) {
        return _members[account];
    }

    /**
     * @notice Get the total number of members
     * @return Number of members
     */
    function getMemberCount() external view override returns (uint256) {
        return _memberCount;
    }

    /**
     * @notice Execute a transaction from the Vault
     * @param target Target address
     * @param value ETH value to send
     * @param data Transaction data
     * @return success Whether the transaction succeeded
     * @return returnData Return data from the transaction
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external override returns (bool success, bytes memory returnData) {
        require(msg.sender == _owner, "Only owner can execute");
        require(target != address(0), "Invalid target");

        (success, returnData) = target.call{value: value}(data);

        emit TransactionExecuted(target, value, data, success);

        return (success, returnData);
    }

    /**
     * @notice Add a member (for testing)
     * @param member Member address
     */
    function addMember(address member) external {
        require(msg.sender == _owner, "Only owner can add members");
        require(member != address(0), "Invalid member");
        require(!_members[member], "Already a member");

        _members[member] = true;
        _memberCount++;

        emit MemberAdded(member, "member");
    }

    /**
     * @notice Remove a member (for testing)
     * @param member Member address
     */
    function removeMember(address member) external {
        require(msg.sender == _owner, "Only owner can remove members");
        require(_members[member], "Not a member");
        require(member != _owner, "Cannot remove owner");

        _members[member] = false;
        _memberCount--;

        emit MemberRemoved(member);
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
