// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IVault
 * @notice Interface for Vault contracts
 * @dev Defines the standard interface that all Vault implementations must follow
 */
interface IVault {
    /**
     * @notice Initialize the Vault
     * @param owner Initial owner address
     * @param name Vault name
     */
    function initialize(address owner, string calldata name) external;

    /**
     * @notice Get the Vault owner
     * @return Owner address
     */
    function owner() external view returns (address);

    /**
     * @notice Get the Vault name
     * @return Vault name
     */
    function name() external view returns (string memory);

    /**
     * @notice Get the Vault address
     * @return Vault contract address
     */
    function getAddress() external view returns (address);

    /**
     * @notice Check if an address is a member of the Vault
     * @param account Address to check
     * @return True if the address is a member
     */
    function isMember(address account) external view returns (bool);

    /**
     * @notice Get the total number of members
     * @return Number of members
     */
    function getMemberCount() external view returns (uint256);

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
    ) external returns (bool success, bytes memory returnData);

    /**
     * @notice Events
     */
    event VaultInitialized(address indexed owner, string name);
    event MemberAdded(address indexed member, string role);
    event MemberRemoved(address indexed member);
    event TransactionExecuted(
        address indexed target,
        uint256 value,
        bytes data,
        bool success
    );
}
