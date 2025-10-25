// JSON Schema Reference for Backend Integration
// These are the expected data structures for API integration

export const ESCROW_SCHEMA = `
// Escrow Entity Schema
{
  "escrowId": "string", // 0x prefixed hex string (bytes32)
  "shortId": "string", // Human readable short ID (ESC-2024-001)
  "amount": "string", // Wei amount as string
  "token": "string", // Token contract address or symbol
  "recipient": "string", // 0x prefixed address
  "creator": "string", // 0x prefixed address
  "status": "pending" | "approved" | "released" | "cancelled" | "expired",
  "currentApprovals": "number",
  "requiredApprovals": "number",
  "deadline": "string", // ISO 8601 timestamp
  "policyId": "string", // bytes32 policy hash
  "description": "string",
  "createdAt": "string", // ISO 8601 timestamp
  "updatedAt": "string", // ISO 8601 timestamp
  "bundlerJobId": "string | null",
  "metadata": {
    "ipfsHash": "string | null",
    "tags": "string[]"
  }
}
`;

export const TIMELINE_EVENT_SCHEMA = `
// Timeline Event Schema
{
  "eventId": "string",
  "escrowId": "string",
  "timestamp": "string", // ISO 8601
  "eventType": "created" | "approved" | "rejected" | "released" | "cancelled" | "policy_check" | "notification_sent",
  "actor": "string", // address or "system"
  "details": "string",
  "metadata": {
    "txHash": "string | null",
    "userOpHash": "string | null",
    "paymasterResponse": {
      "code": "number",
      "message": "string",
      "sponsorCost": "string | null" // Wei amount
    } | null,
    "comment": "string | null"
  }
}
`;

export const NOTIFICATION_SCHEMA = `
// Notification Schema
{
  "notificationId": "string",
  "userId": "string", // recipient user ID
  "type": "approval_required" | "status_update" | "system_warning" | "policy_update" | "member_update",
  "priority": "low" | "normal" | "medium" | "high",
  "title": "string",
  "message": "string",
  "read": "boolean",
  "createdAt": "string", // ISO 8601
  "readAt": "string | null", // ISO 8601
  "targetRoles": "string[]", // ["requester", "approver", "owner", "viewer"]
  "actions": "string[]", // Available actions ["approve", "reject", "view", "dismiss"]
  "metadata": {
    "escrowId": "string | null",
    "policyId": "string | null",
    "deepLink": "string | null"
  }
}
`;

export const POLICY_SCHEMA = `
// Policy Schema
{
  "policyId": "string", // bytes32 hash
  "name": "string",
  "description": "string",
  "threshold": "string", // "2/3" format
  "timelock": "number", // seconds
  "rolesRoot": "string", // Merkle root for roles
  "status": "draft" | "active" | "archived",
  "createdAt": "string", // ISO 8601
  "updatedAt": "string", // ISO 8601
  "scheduledUpdate": "string | null", // ISO 8601
  "usageCount": "number",
  "config": {
    "maxAmount": "string | null", // Wei amount
    "allowedTokens": "string[] | null", // Contract addresses
    "restrictions": "object | null"
  }
}
`;

export const PAYMASTER_STATUS_SCHEMA = `
// Paymaster Status Schema
{
  "balance": "string", // Wei amount
  "dailyUsage": "string", // Wei amount used today
  "monthlyLimit": "string", // Wei monthly limit
  "dailyLimit": "string", // Wei daily limit
  "healthStatus": "healthy" | "warning" | "critical",
  "lastTopUp": "string", // ISO 8601
  "autoRefill": "boolean",
  "fallbackEnabled": "boolean",
  "refillThreshold": "string", // Wei amount
  "estimatedDaysRemaining": "number",
  "sponsorshipCheck": {
    "available": "boolean",
    "reason": "string",
    "estimatedGas": "string", // Wei amount
    "poolBalance": "string", // Wei amount
    "dailyRemaining": "string" // Wei amount
  }
}
`;

export const USER_SCHEMA = `
// User/Member Schema
{
  "userId": "string",
  "walletAddress": "string", // 0x prefixed
  "name": "string",
  "email": "string | null",
  "role": "owner" | "approver" | "requester" | "viewer",
  "joinedAt": "string", // ISO 8601
  "lastActivity": "string", // ISO 8601
  "permissions": "string[]", // Granular permissions
  "devices": [
    {
      "deviceId": "string",
      "name": "string",
      "type": "mobile" | "desktop" | "browser",
      "platform": "string",
      "pushToken": "string | null", // Expo push token
      "lastSeen": "string", // ISO 8601
      "pushEnabled": "boolean"
    }
  ]
}
`;

export const AUDIT_LOG_SCHEMA = `
// Audit Log Schema
{
  "logId": "string",
  "timestamp": "string", // ISO 8601
  "action": "string", // escrow.created, policy.updated, etc.
  "actor": "string", // user ID or "system"
  "actorRole": "string",
  "vaultId": "string",
  "resourceType": "escrow" | "policy" | "user" | "vault" | "notification",
  "resourceId": "string | null",
  "details": "string",
  "metadata": {
    "txHash": "string | null",
    "ipAddress": "string | null",
    "userAgent": "string | null",
    "bundlerJobId": "string | null"
  },
  "status": "success" | "failed" | "pending"
}
`;

export const WEBHOOK_SCHEMA = `
// Webhook Configuration Schema
{
  "webhookId": "string",
  "url": "string",
  "events": "string[]", // Event types to subscribe to
  "status": "active" | "paused" | "failed",
  "secret": "string", // For signature verification
  "lastDelivery": "string | null", // ISO 8601
  "deliveryRate": "number", // Percentage success rate
  "retryPolicy": {
    "maxRetries": "number",
    "backoffMultiplier": "number"
  },
  "headers": "object | null", // Custom headers
  "createdAt": "string", // ISO 8601
  "updatedAt": "string" // ISO 8601
}
`;

// API Error Response Schema
export const ERROR_RESPONSE_SCHEMA = `
// Standard Error Response
{
  "error": {
    "code": "string", // ERROR_CODE_CONSTANT
    "message": "string", // Human readable message
    "details": "string | null", // Additional details
    "field": "string | null", // Field that caused validation error
    "timestamp": "string", // ISO 8601
    "requestId": "string" // For tracking
  }
}
`;

// API Success Response Schema
export const SUCCESS_RESPONSE_SCHEMA = `
// Standard Success Response
{
  "data": "object | array", // Response payload
  "meta": {
    "timestamp": "string", // ISO 8601
    "requestId": "string",
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "hasNext": "boolean"
    } | null
  }
}
`;