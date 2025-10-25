# Collection Components Migration Guide

## Overview

Migrate existing Collection components from legacy API (`/api/collections`) to new Policy-Based Escrows API (`/api/escrows`).

## Architecture Change

### Before (Legacy Collection API)
```
Collection → escrowDrafts (payment only) + metadata
```

### After (Policy-Based Architecture)
```
Vault → Policy (collection) → Escrow (collection)
```

## Key Changes

1. **Policy Association**: Collections now require a Collection Policy
2. **API Endpoint**: `/api/collections` → `/api/escrows` with `type: 'collection'`
3. **Data Structure**: Participants stored in `escrow.participants` (JSONB)
4. **Type Safety**: Discriminated unions for Payment vs Collection

---

## Migration Steps

### 1. CollectionCreation.tsx

#### Import Changes

```typescript
// Before:
import { useCreateCollection } from '@/hooks/useCollections';

// After:
import { useCreateEscrowAPI } from '@/hooks/useEscrowsAPI';
import { usePoliciesAPI } from '@/hooks/usePoliciesAPI';
```

#### Add Policy Selector

```typescript
// Fetch Collection Policies
const { data: policiesData } = usePoliciesAPI({
  vaultId,
  type: 'collection',
  active: true,
});

const policies = policiesData?.policies || [];

// Add state for selected policy
const [selectedPolicyId, setSelectedPolicyId] = useState('');
```

#### UI: Policy Selector

```tsx
<div>
  <Label htmlFor="policy" className="text-white">
    Collection Policy *
  </Label>
  <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
    <SelectTrigger className="glass border-white/20 text-white mt-2">
      <SelectValue placeholder="Select a collection policy..." />
    </SelectTrigger>
    <SelectContent>
      {policies.map((policy) => (
        <SelectItem key={policy.id} value={policy.id}>
          {policy.name}
          {policy.description && (
            <span className="text-xs text-muted-foreground ml-2">
              - {policy.description}
            </span>
          )}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground mt-1">
    Collection policies define rules like partial payments, auto-completion, and reminders
  </p>
</div>
```

#### API Call Changes

```typescript
// Before:
const { mutate: createCollection, isPending: isCreating } = useCreateCollection();

createCollection(
  {
    vaultId,
    vaultAddress,
    name,
    description,
    token,
    deadline: deadline ? new Date(deadline) : undefined,
    participants: validParticipants,
    createdBy: userAddress,
    note,
  },
  {
    onSuccess: (collection) => { /* ... */ },
    onError: (error) => { /* ... */ },
  }
);

// After:
const { mutate: createEscrow, isPending: isCreating } = useCreateEscrowAPI();

createEscrow(
  {
    type: 'collection',
    vaultId,
    policyId: selectedPolicyId, // NEW: Required
    name,
    description,
    token,
    participants: validParticipants,
    deadline: deadline ? new Date(deadline).toISOString() : undefined,
    metadata: { note }, // Optional metadata
  },
  {
    onSuccess: (escrow) => {
      toast({
        title: 'Collection created successfully',
        description: `${name} has been created with ${validParticipants.length} participants`,
      });
      if (onCollectionCreated) {
        onCollectionCreated(escrow.id);
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to create collection',
        description: error.message,
        variant: 'destructive',
      });
    },
  }
);
```

#### Validation Updates

```typescript
const validateForm = () => {
  // Existing validations...
  
  // NEW: Check policy selection
  if (!selectedPolicyId) {
    toast({
      title: 'Policy required',
      description: 'Please select a collection policy',
      variant: 'destructive',
    });
    return false;
  }
  
  // Rest of validation...
};
```

---

### 2. CollectionList.tsx

#### Import Changes

```typescript
// Before:
import { useCollections } from '@/hooks/useCollections';

// After:
import { useEscrowsAPI } from '@/hooks/useEscrowsAPI';
```

#### API Call Changes

```typescript
// Before:
const { data: collections, isLoading, refetch } = useCollections(vaultId);

// After:
const { data: escrowsData, isLoading, refetch } = useEscrowsAPI({
  vaultId,
  type: 'collection',
});

const collections = escrowsData?.escrows || [];
```

#### Type Updates

```typescript
// Collections now use Escrow type
import type { CollectionEscrow } from '@shared/types/escrow';

// If type guard needed:
const isCollectionEscrow = (escrow: Escrow): escrow is CollectionEscrow => {
  return escrow.type === 'collection';
};
```

#### Display Updates

```tsx
// Access collection-specific fields
{collections.map((collection) => (
  <div key={collection.id}>
    <h3>{collection.name}</h3>
    <p>Total: {collection.totalAmount}</p>
    <p>Collected: {collection.collectedAmount || '0'}</p>
    <p>Participants: {collection.participants?.length || 0}</p>
    <Badge>{collection.status}</Badge>
  </div>
))}
```

---

### 3. CollectionDetail.tsx

#### Import Changes

```typescript
// Before:
import { useCollection, useRecordPayment } from '@/hooks/useCollections';

// After:
import { useEscrowAPI, useRecordCollectionPaymentAPI } from '@/hooks/useEscrowsAPI';
```

#### API Call Changes

```typescript
// Before:
const { data: collectionDetail, isLoading } = useCollection(collectionId);
const { mutate: recordPayment } = useRecordPayment();

// After:
const { data: escrow, isLoading } = useEscrowAPI(collectionId);
const { mutate: recordPayment } = useRecordCollectionPaymentAPI();

// Use escrow data
const collection = escrow as CollectionEscrow | undefined;
```

#### Payment Recording

```typescript
// Before:
recordPayment({
  collectionId,
  participantAddress,
  amount,
  txHash,
});

// After:
recordPayment({
  escrowId: collectionId,
  participantAddress,
  amount,
  txHash,
});
```

---

## Testing Checklist

### CollectionCreation
- [ ] Policy selector shows only Collection Policies
- [ ] Policy selection is required
- [ ] Collection created with correct policy association
- [ ] All participant data saved correctly
- [ ] Deadline and metadata preserved

### CollectionList
- [ ] Collections load from new API
- [ ] Status badges display correctly
- [ ] Collected amount vs total amount shown
- [ ] Participant count accurate

### CollectionDetail
- [ ] Collection details display correctly
- [ ] Participants list with payment status
- [ ] Payment recording works
- [ ] Progress calculation accurate
- [ ] Policy information displayed

---

## Rollback Plan

If issues occur:

1. **Keep Legacy API**: The old `/api/collections` endpoints remain functional
2. **Revert Imports**: Change imports back to `useCollections`
3. **Component Restore**: Use git to restore original components
4. **No Data Loss**: New escrows table does not affect old escrowDrafts

---

## Benefits of Migration

1. **Policy-Based Rules**: Centralized collection settings
2. **Type Safety**: Full TypeScript support for Payment/Collection
3. **Better Architecture**: Clear separation of concerns
4. **Enhanced Features**: Partial payments, auto-completion, reminders
5. **Unified API**: Single endpoint for all escrow types

---

## Support

- Full implementation examples: `docs/design/UI_IMPLEMENTATION_PLAN.md`
- API documentation: `apps/api/src/routes/escrows.ts`
- Type definitions: `packages/shared/src/types/escrow.ts`
