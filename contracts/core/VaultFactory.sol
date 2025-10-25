// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../interfaces/IVault.sol";

/**
 * @title VaultFactory
 * @notice Factory contract for deterministic Vault deployment using CREATE2
 * @dev Manages Vault creation with UUID-based salt generation for deterministic addresses
 */
contract VaultFactory is Initializable, AccessControlUpgradeable {
    /// @notice Role for factory operators
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Implementation address for Vault clones
    address public vaultImplementation;

    /// @notice Chain ID of current network
    uint256 public immutable chainId;

    /// @notice Mapping from Vault address to deployment status
    mapping(address => bool) public isVault;

    /// @notice Mapping from UUID (16 bytes) to Vault address
    mapping(bytes16 => address) public uuidToVault;

    /// @notice Mapping from Vault address to UUID
    mapping(address => bytes16) public vaultToUuid;

    /// @notice Mapping from Vault address to salt used for CREATE2
    mapping(address => bytes32) public vaultToSalt;

    /// @notice Events
    event VaultCreated(
        address indexed vaultAddress,
        bytes16 indexed uuid,
        address indexed owner,
        bytes32 salt,
        string caip10
    );

    event ImplementationUpdated(
        address indexed oldImplementation,
        address indexed newImplementation
    );

    /// @notice Custom errors
    error VaultAlreadyExists(bytes16 uuid);
    error InvalidImplementation();
    error InvalidOwner();
    error VaultNotFound(address vaultAddress);
    error DeploymentFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        chainId = block.chainid;
        _disableInitializers();
    }

    /**
     * @notice Initialize the factory
     * @param _vaultImplementation Address of Vault implementation contract
     * @param admin Address to grant admin role
     */
    function initialize(
        address _vaultImplementation,
        address admin
    ) public initializer {
        require(_vaultImplementation != address(0), InvalidImplementation());
        require(admin != address(0), InvalidOwner());

        __AccessControl_init();

        vaultImplementation = _vaultImplementation;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }

    /**
     * @notice Create a new Vault with deterministic address
     * @param uuid 16-byte UUID for the Vault
     * @param owner Initial owner address
     * @param name Vault name
     * @return vaultAddress Address of created Vault
     */
    function createVault(
        bytes16 uuid,
        address owner,
        string calldata name
    ) external returns (address vaultAddress) {
        require(owner != address(0), InvalidOwner());
        require(uuidToVault[uuid] == address(0), VaultAlreadyExists(uuid));

        // Generate salt from UUID, owner, and chain ID
        bytes32 salt = keccak256(abi.encodePacked(uuid, owner, chainId));

        // Deploy clone using CREATE2
        vaultAddress = Clones.cloneDeterministic(vaultImplementation, salt);
        require(vaultAddress != address(0), DeploymentFailed());

        // Initialize the Vault
        IVault(vaultAddress).initialize(owner, name);

        // Record deployment
        isVault[vaultAddress] = true;
        uuidToVault[uuid] = vaultAddress;
        vaultToUuid[vaultAddress] = uuid;
        vaultToSalt[vaultAddress] = salt;

        // Generate CAIP-10 identifier
        string memory caip10 = string(
            abi.encodePacked(
                "eip155:",
                _toString(chainId),
                ":",
                _toHexString(vaultAddress)
            )
        );

        emit VaultCreated(vaultAddress, uuid, owner, salt, caip10);

        return vaultAddress;
    }

    /**
     * @notice Predict Vault address before deployment
     * @param uuid 16-byte UUID
     * @param owner Owner address
     * @return predictedAddress Predicted Vault address
     */
    function predictVaultAddress(
        bytes16 uuid,
        address owner
    ) external view returns (address predictedAddress) {
        bytes32 salt = keccak256(abi.encodePacked(uuid, owner, chainId));
        return Clones.predictDeterministicAddress(vaultImplementation, salt);
    }

    /**
     * @notice Get Vault information by UUID
     * @param uuid 16-byte UUID
     * @return vaultAddress Address of the Vault
     * @return exists Whether the Vault exists
     * @return salt Salt used for CREATE2
     */
    function getVaultByUuid(bytes16 uuid)
        external
        view
        returns (
            address vaultAddress,
            bool exists,
            bytes32 salt
        )
    {
        vaultAddress = uuidToVault[uuid];
        exists = isVault[vaultAddress];
        salt = vaultToSalt[vaultAddress];
        return (vaultAddress, exists, salt);
    }

    /**
     * @notice Get UUID by Vault address
     * @param vaultAddress Address of the Vault
     * @return uuid 16-byte UUID
     * @return exists Whether the Vault exists
     */
    function getUuidByVault(address vaultAddress)
        external
        view
        returns (bytes16 uuid, bool exists)
    {
        require(isVault[vaultAddress], VaultNotFound(vaultAddress));
        uuid = vaultToUuid[vaultAddress];
        exists = true;
        return (uuid, exists);
    }

    /**
     * @notice Generate CAIP-10 identifier for a Vault
     * @param vaultAddress Address of the Vault
     * @return caip10 CAIP-10 formatted identifier
     */
    function getCAIP10(address vaultAddress)
        external
        view
        returns (string memory caip10)
    {
        require(isVault[vaultAddress], VaultNotFound(vaultAddress));
        return
            string(
                abi.encodePacked(
                    "eip155:",
                    _toString(chainId),
                    ":",
                    _toHexString(vaultAddress)
                )
            );
    }

    /**
     * @notice Update Vault implementation address
     * @param newImplementation New implementation address
     */
    function updateImplementation(address newImplementation)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newImplementation != address(0), InvalidImplementation());
        address oldImplementation = vaultImplementation;
        vaultImplementation = newImplementation;
        emit ImplementationUpdated(oldImplementation, newImplementation);
    }

    /**
     * @notice Convert uint256 to string
     * @param value Value to convert
     * @return String representation
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @notice Convert address to hex string
     * @param addr Address to convert
     * @return Hex string representation
     */
    function _toHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = new bytes(42);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint160(addr) >> (8 * (19 - i))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            buffer[2 * i + 2] = _char(hi);
            buffer[2 * i + 3] = _char(lo);
        }
        return string(buffer);
    }

    /**
     * @notice Convert byte to hex char
     * @param b Byte to convert
     * @return c Hex char
     */
    function _char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
