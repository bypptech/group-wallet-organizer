/**
 * Family Wallet Subgraph Mapping
 * Handles events from EscrowRegistry contract
 */

import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  EscrowCreated,
  ApprovalGranted,
  EscrowReleased,
  EscrowCancelled,
  EscrowStateChanged,
} from "../generated/EscrowRegistry/EscrowRegistry";
import {
  Vault,
  Escrow,
  Approval,
  TimelineEvent,
  VaultStats,
  GlobalStats,
  DailyStats,
} from "../generated/schema";

/**
 * Handle EscrowCreated event
 * Event signature: EscrowCreated(uint256 indexed escrowId, address indexed vaultAddress, address indexed requester, address recipient, address tokenAddress, uint256 amount, EscrowType escrowType)
 */
export function handleEscrowCreated(event: EscrowCreated): void {
  // Load or create Vault
  let vaultAddress = event.params.vaultAddress;
  let vault = Vault.load(vaultAddress);

  if (vault == null) {
    vault = new Vault(vaultAddress);
    vault.vaultAddress = vaultAddress;
    vault.createdAt = event.block.timestamp;
    vault.createdTx = event.transaction.hash;
    vault.blockNumber = event.block.number;
    vault.save();

    // Update global stats for new vault
    updateGlobalStats(1, 0, 0);
  }

  // Create Escrow entity
  let escrowId = event.params.escrowId;
  let escrow = new Escrow(escrowId.toString());
  escrow.escrowId = escrowId;
  escrow.vault = vaultAddress;
  escrow.vaultAddress = vaultAddress;
  escrow.requester = event.params.requester;
  escrow.recipient = event.params.recipient;
  escrow.tokenAddress = event.params.tokenAddress;
  escrow.amount = event.params.amount;
  escrow.escrowType = event.params.escrowType;
  escrow.approvalType = 0; // Default ASYNC, will be updated from contract if needed
  escrow.state = "DRAFT";
  escrow.title = "";
  escrow.description = "";
  escrow.scheduledReleaseAt = BigInt.fromI32(0);
  escrow.expiresAt = BigInt.fromI32(0);
  escrow.metadataHash = Bytes.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000000");
  escrow.createdAt = event.block.timestamp;
  escrow.updatedAt = event.block.timestamp;
  escrow.createdTx = event.transaction.hash;
  escrow.createdBy = event.params.requester;
  escrow.blockNumber = event.block.number;
  escrow.save();

  // Create timeline event
  createTimelineEvent(
    event.transaction.hash,
    event.logIndex,
    escrowId,
    "ESCROW_CREATED",
    event.params.requester,
    event.block.timestamp,
    event.transaction.hash,
    event.block.number,
    event.block.hash,
    -1,
    -1,
    ""
  );

  // Update vault stats
  updateVaultStats(vaultAddress, event.block.timestamp, 1, 0, 0, 0);

  // Update global stats
  updateGlobalStats(0, 1, 0);

  // Update daily stats
  updateDailyStats(event.block.timestamp, 1, 0, 0, 0, event.params.requester, 0);
}

/**
 * Handle ApprovalGranted event
 * Event signature: ApprovalGranted(uint256 indexed escrowId, address indexed approver, uint256 currentApprovals, uint256 requiredApprovals)
 */
export function handleApprovalGranted(event: ApprovalGranted): void {
  let escrowId = event.params.escrowId;
  let escrow = Escrow.load(escrowId.toString());

  if (escrow == null) {
    // Escrow should exist, but handle gracefully
    return;
  }

  // Create Approval entity
  let approvalId = escrowId
    .toString()
    .concat("-")
    .concat(event.params.approver.toHexString())
    .concat("-")
    .concat(event.block.timestamp.toString());

  let approval = new Approval(approvalId);
  approval.escrow = escrowId.toString();
  approval.escrowId = escrowId;
  approval.approver = event.params.approver;
  approval.timestamp = event.block.timestamp;
  approval.txHash = event.transaction.hash;
  approval.currentApprovals = event.params.currentApprovals.toI32();
  approval.requiredApprovals = event.params.requiredApprovals.toI32();
  approval.blockNumber = event.block.number;
  approval.save();

  // Create timeline event
  createTimelineEvent(
    event.transaction.hash,
    event.logIndex,
    escrowId,
    "APPROVAL_GRANTED",
    event.params.approver,
    event.block.timestamp,
    event.transaction.hash,
    event.block.number,
    event.block.hash,
    -1,
    -1,
    ""
  );

  // Update global stats
  updateGlobalStats(0, 0, 1);

  // Update daily stats
  updateDailyStats(event.block.timestamp, 0, 1, 0, 0, event.params.approver, 0);
}

/**
 * Handle EscrowReleased event
 * Event signature: EscrowReleased(uint256 indexed escrowId, address indexed recipient, address tokenAddress, uint256 amount)
 */
export function handleEscrowReleased(event: EscrowReleased): void {
  let escrowId = event.params.escrowId;
  let escrow = Escrow.load(escrowId.toString());

  if (escrow == null) {
    return;
  }

  // Update escrow status
  escrow.state = "RELEASED";
  escrow.releasedAt = event.block.timestamp;
  escrow.updatedAt = event.block.timestamp;
  escrow.save();

  // Create timeline event
  createTimelineEvent(
    event.transaction.hash,
    event.logIndex,
    escrowId,
    "ESCROW_RELEASED",
    event.params.recipient,
    event.block.timestamp,
    event.transaction.hash,
    event.block.number,
    event.block.hash,
    -1,
    -1,
    ""
  );

  // Update vault stats
  updateVaultStats(escrow.vaultAddress, event.block.timestamp, 0, 0, 1, 0);

  // Update daily stats
  updateDailyStats(event.block.timestamp, 0, 0, 1, 0, event.params.recipient, 0);
}

/**
 * Handle EscrowCancelled event
 * Event signature: EscrowCancelled(uint256 indexed escrowId, address indexed cancelledBy, string reason)
 */
export function handleEscrowCancelled(event: EscrowCancelled): void {
  let escrowId = event.params.escrowId;
  let escrow = Escrow.load(escrowId.toString());

  if (escrow == null) {
    return;
  }

  // Update escrow status
  escrow.state = "CANCELLED";
  escrow.cancelledAt = event.block.timestamp;
  escrow.updatedAt = event.block.timestamp;
  escrow.save();

  // Create timeline event
  createTimelineEvent(
    event.transaction.hash,
    event.logIndex,
    escrowId,
    "ESCROW_CANCELLED",
    event.params.cancelledBy,
    event.block.timestamp,
    event.transaction.hash,
    event.block.number,
    event.block.hash,
    -1,
    -1,
    event.params.reason
  );

  // Update vault stats
  updateVaultStats(escrow.vaultAddress, event.block.timestamp, 0, 0, 0, 1);

  // Update daily stats
  updateDailyStats(event.block.timestamp, 0, 0, 0, 1, event.params.cancelledBy, 0);
}

/**
 * Handle EscrowStateChanged event
 * Event signature: EscrowStateChanged(uint256 indexed escrowId, EscrowState previousState, EscrowState newState, address indexed changedBy)
 */
export function handleEscrowStateChanged(event: EscrowStateChanged): void {
  let escrowId = event.params.escrowId;
  let escrow = Escrow.load(escrowId.toString());

  if (escrow == null) {
    return;
  }

  // Map state enum to string
  let newStateStr = mapEscrowState(event.params.newState);
  escrow.state = newStateStr;
  escrow.updatedAt = event.block.timestamp;
  escrow.save();

  // Create timeline event
  createTimelineEvent(
    event.transaction.hash,
    event.logIndex,
    escrowId,
    "ESCROW_STATE_CHANGED",
    event.params.changedBy,
    event.block.timestamp,
    event.transaction.hash,
    event.block.number,
    event.block.hash,
    event.params.previousState,
    event.params.newState,
    ""
  );
}

/**
 * Helper: Map EscrowState enum to string
 */
function mapEscrowState(state: i32): string {
  if (state == 0) return "DRAFT";
  if (state == 1) return "PENDING";
  if (state == 2) return "APPROVED";
  if (state == 3) return "READY";
  if (state == 4) return "RELEASED";
  if (state == 5) return "CANCELLED";
  if (state == 6) return "EXPIRED";
  return "DRAFT";
}

/**
 * Helper: Create timeline event
 */
function createTimelineEvent(
  txHash: Bytes,
  logIndex: BigInt,
  escrowId: BigInt,
  eventType: string,
  actor: Bytes,
  timestamp: BigInt,
  txHashParam: Bytes,
  blockNumber: BigInt,
  blockHash: Bytes,
  previousState: i32,
  newState: i32,
  reason: string
): void {
  let eventId = txHash.toHexString().concat("-").concat(logIndex.toString());
  let timelineEvent = new TimelineEvent(eventId);

  timelineEvent.escrow = escrowId.toString();
  timelineEvent.escrowId = escrowId;
  timelineEvent.eventType = eventType;
  timelineEvent.actor = actor;
  timelineEvent.timestamp = timestamp;
  timelineEvent.txHash = txHashParam;
  timelineEvent.blockNumber = blockNumber;
  timelineEvent.blockHash = blockHash;
  timelineEvent.logIndex = logIndex;

  // Set optional fields
  if (previousState >= 0) {
    timelineEvent.previousState = previousState;
  }
  if (newState >= 0) {
    timelineEvent.newState = newState;
  }
  if (reason.length > 0) {
    timelineEvent.reason = reason;
  }

  timelineEvent.save();
}

/**
 * Helper: Update vault statistics
 */
function updateVaultStats(
  vaultAddress: Bytes,
  timestamp: BigInt,
  newEscrows: i32,
  approvedEscrows: i32,
  releasedEscrows: i32,
  cancelledEscrows: i32
): void {
  let stats = VaultStats.load(vaultAddress);

  if (stats == null) {
    stats = new VaultStats(vaultAddress);
    stats.vault = vaultAddress;
    stats.totalEscrows = 0;
    stats.pendingEscrows = 0;
    stats.approvedEscrows = 0;
    stats.releasedEscrows = 0;
    stats.cancelledEscrows = 0;
    stats.totalMembers = 0;
  }

  stats.totalEscrows = stats.totalEscrows + newEscrows;
  stats.pendingEscrows = stats.pendingEscrows + newEscrows - approvedEscrows - releasedEscrows - cancelledEscrows;
  stats.approvedEscrows = stats.approvedEscrows + approvedEscrows;
  stats.releasedEscrows = stats.releasedEscrows + releasedEscrows;
  stats.cancelledEscrows = stats.cancelledEscrows + cancelledEscrows;
  stats.lastUpdated = timestamp;

  stats.save();
}

/**
 * Helper: Update global statistics
 */
function updateGlobalStats(
  newVaults: i32,
  newEscrows: i32,
  newApprovals: i32
): void {
  let globalId = Bytes.fromHexString("0x676c6f62616c"); // "global" in hex
  let stats = GlobalStats.load(globalId);

  if (stats == null) {
    stats = new GlobalStats(globalId);
    stats.totalVaults = 0;
    stats.totalEscrows = 0;
    stats.totalApprovals = 0;
    stats.lastUpdated = BigInt.fromI32(0);
  }

  stats.totalVaults = stats.totalVaults + newVaults;
  stats.totalEscrows = stats.totalEscrows + newEscrows;
  stats.totalApprovals = stats.totalApprovals + newApprovals;
  stats.lastUpdated = BigInt.fromI32(0);

  stats.save();
}

/**
 * Helper: Update daily statistics
 */
function updateDailyStats(
  timestamp: BigInt,
  escrowsCreated: i32,
  escrowsApproved: i32,
  escrowsReleased: i32,
  escrowsCancelled: i32,
  actor: Bytes,
  newVaults: i32
): void {
  // Calculate day start timestamp (midnight UTC)
  let dayStart = timestamp.toI32() - (timestamp.toI32() % 86400);
  let dayId = Bytes.fromI32(dayStart);

  let stats = DailyStats.load(dayId);

  if (stats == null) {
    stats = new DailyStats(dayId);
    stats.date = dayStart;
    stats.escrowsCreated = 0;
    stats.escrowsApproved = 0;
    stats.escrowsReleased = 0;
    stats.escrowsCancelled = 0;
    stats.activeAddresses = [];
    stats.newVaults = 0;
  }

  stats.escrowsCreated = stats.escrowsCreated + escrowsCreated;
  stats.escrowsApproved = stats.escrowsApproved + escrowsApproved;
  stats.escrowsReleased = stats.escrowsReleased + escrowsReleased;
  stats.escrowsCancelled = stats.escrowsCancelled + escrowsCancelled;
  stats.newVaults = stats.newVaults + newVaults;

  // Add actor to active addresses if not already present
  let addresses = stats.activeAddresses;
  let found = false;

  for (let i = 0; i < addresses.length; i++) {
    if (addresses[i].equals(actor)) {
      found = true;
      break;
    }
  }

  if (!found) {
    addresses.push(actor);
    stats.activeAddresses = addresses;
  }

  stats.save();
}
