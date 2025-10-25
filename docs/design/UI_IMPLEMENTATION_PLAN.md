# Policy-Based Architecture - 残りUI実装プラン

## 概要

Phase 1（API hooks基盤整備）が完了し、Phase 2以降のUI実装を行うための詳細プランです。

## 現状確認

### ✅ 完了済み
- Backend API完全実装 (Payment/Collection両対応)
- Shared types定義完成
- API hooks基盤整備 (usePoliciesAPI, useEscrowsAPI)

### 🔨 実装が必要なUI

#### Phase 2: Policy UI拡張
- PolicyCreation.tsx: Collection Policy作成UI
- PolicyList.tsx: Type filter/badge表示
- PolicyDetail.tsx: Collection設定表示

#### Phase 3: Escrow UI統合
- EscrowCreation.tsx: Type選択UI
- EscrowList.tsx: Type filter表示
- EscrowDetail.tsx: Collection詳細表示

#### Phase 4: Collection統合
- CollectionList.tsx: Escrows API使用
- CollectionCreation.tsx: Escrows API使用
- CollectionDetail.tsx: Escrows API使用

---

## Phase 2: Policy UI拡張

### Phase 2.1: PolicyCreation.tsx - Collection Policy対応

#### 現在の実装状態
```tsx
// 現在: Payment Policyのみ対応
const [formData, setFormData] = useState({
  name: '',
  description: '',
  minApprovals: '2',
  maxAmount: '1000',
  cooldownHours: '24',
});
```

#### 必要な変更

**1. Policy Type選択を追加**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';

const [policyType, setPolicyType] = useState<'payment' | 'collection'>('payment');

// UI: Type Selector
<div className="space-y-2">
  <Label htmlFor="policyType">
    Policy Type <span className="text-red-500">*</span>
  </Label>
  <Tabs value={policyType} onValueChange={(v) => setPolicyType(v as any)}>
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="payment">
        <DollarSign className="h-4 w-4 mr-2" />
        Payment Policy
      </TabsTrigger>
      <TabsTrigger value="collection">
        <Users className="h-4 w-4 mr-2" />
        Collection Policy
      </TabsTrigger>
    </TabsList>
  </Tabs>
</div>
```

**2. Payment Policy Form (既存)**
```tsx
{policyType === 'payment' && (
  <TabsContent value="payment" className="space-y-4">
    {/* 既存のPayment Policy Form */}
    <div className="space-y-2">
      <Label>Minimum Approvals Required</Label>
      <Input type="number" name="minApprovals" />
    </div>
    <div className="space-y-2">
      <Label>Maximum Transaction Amount (USDC)</Label>
      <Input type="number" name="maxAmount" />
    </div>
    <div className="space-y-2">
      <Label>Cooldown Period (Hours)</Label>
      <Input type="number" name="cooldownHours" />
    </div>
  </TabsContent>
)}
```

**3. Collection Policy Form (新規)**
```tsx
{policyType === 'collection' && (
  <TabsContent value="collection" className="space-y-4">
    <Alert>
      <Users className="h-4 w-4" />
      <AlertDescription>
        Collection policies define rules for group fund collection.
        Configure payment terms and participant requirements.
      </AlertDescription>
    </Alert>

    <Separator />

    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Collection Settings</h3>

      {/* Allow Partial Payment */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="allowPartialPayment"
          checked={formData.allowPartialPayment}
          onCheckedChange={(checked) =>
            handleChange('allowPartialPayment', checked)
          }
        />
        <Label htmlFor="allowPartialPayment" className="cursor-pointer">
          <div>
            <p className="font-medium">Allow Partial Payment</p>
            <p className="text-xs text-muted-foreground">
              Participants can pay in multiple installments
            </p>
          </div>
        </Label>
      </div>

      {/* Auto Complete */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="autoComplete"
          checked={formData.autoComplete}
          onCheckedChange={(checked) =>
            handleChange('autoComplete', checked)
          }
        />
        <Label htmlFor="autoComplete" className="cursor-pointer">
          <div>
            <p className="font-medium">Auto-complete Collection</p>
            <p className="text-xs text-muted-foreground">
              Automatically mark as complete when all participants pay
            </p>
          </div>
        </Label>
      </div>

      {/* Default Deadline */}
      <div className="space-y-2">
        <Label htmlFor="defaultDeadline" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Default Payment Deadline (Days)
        </Label>
        <Input
          id="defaultDeadline"
          type="number"
          min="1"
          placeholder="7"
          value={formData.defaultDeadline}
          onChange={(e) => handleChange('defaultDeadline', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Default deadline from collection creation date
        </p>
      </div>

      {/* Reminder Settings */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Payment Reminders
        </Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="reminderEnabled"
            checked={formData.reminderEnabled}
            onCheckedChange={(checked) =>
              handleChange('reminderEnabled', checked)
            }
          />
          <Label htmlFor="reminderEnabled" className="cursor-pointer">
            Enable automatic reminders
          </Label>
        </div>
        {formData.reminderEnabled && (
          <div className="pl-6 space-y-2">
            <Label htmlFor="reminderDays">Send reminder (days before deadline)</Label>
            <Input
              id="reminderDays"
              type="number"
              min="1"
              placeholder="3"
              value={formData.reminderDays}
              onChange={(e) => handleChange('reminderDays', e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  </TabsContent>
)}
```

**4. Form Data State更新**
```tsx
const [formData, setFormData] = useState({
  // Common fields
  name: '',
  description: '',
  
  // Payment Policy fields
  minApprovals: '2',
  maxAmount: '1000',
  cooldownHours: '24',
  rolesRoot: ZERO_HASH,
  ownersRoot: ZERO_HASH,
  
  // Collection Policy fields
  allowPartialPayment: true,
  autoComplete: true,
  defaultDeadline: '7',
  reminderEnabled: false,
  reminderDays: '3',
});
```

**5. Submit Handler更新**
```tsx
const handleSubmit = () => {
  if (!validateForm()) {
    return;
  }

  if (policyType === 'payment') {
    onSave({
      type: 'payment',
      policyId: generatePolicyId(), // Implement this
      vaultId,
      name: formData.name,
      description: formData.description,
      threshold: parseInt(formData.minApprovals),
      timelock: parseInt(formData.cooldownHours) * 3600, // Hours to seconds
      rolesRoot: formData.rolesRoot,
      ownersRoot: formData.ownersRoot,
      maxAmount: parseFloat(formData.maxAmount).toString(),
    });
  } else {
    onSave({
      type: 'collection',
      policyId: generatePolicyId(),
      vaultId,
      name: formData.name,
      description: formData.description,
      collectionConfig: {
        allowPartialPayment: formData.allowPartialPayment,
        autoComplete: formData.autoComplete,
        defaultDeadline: formData.defaultDeadline,
        reminderSettings: formData.reminderEnabled ? {
          enabled: true,
          daysBefore: parseInt(formData.reminderDays),
        } : undefined,
      },
    });
  }
};
```

**6. Validation更新**
```tsx
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  // Common validation
  if (!formData.name.trim()) {
    newErrors.name = 'Policy name is required';
  }

  if (policyType === 'payment') {
    // Payment Policy validation
    const minApprovals = parseInt(formData.minApprovals);
    if (isNaN(minApprovals) || minApprovals < 1) {
      newErrors.minApprovals = 'Minimum approvals must be at least 1';
    }

    const maxAmount = parseFloat(formData.maxAmount);
    if (isNaN(maxAmount) || maxAmount <= 0) {
      newErrors.maxAmount = 'Maximum amount must be greater than 0';
    }
  } else {
    // Collection Policy validation
    const deadline = parseInt(formData.defaultDeadline);
    if (isNaN(deadline) || deadline < 1) {
      newErrors.defaultDeadline = 'Deadline must be at least 1 day';
    }

    if (formData.reminderEnabled) {
      const reminderDays = parseInt(formData.reminderDays);
      if (isNaN(reminderDays) || reminderDays < 1) {
        newErrors.reminderDays = 'Reminder days must be at least 1';
      }
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**完成後のファイル構造:**
- Type selector (Tabs UI)
- Payment Policy Form (既存)
- Collection Policy Form (新規)
- Type別validation
- Type別submit handling

---

### Phase 2.2: PolicyList.tsx - Type Filter/Display

#### 必要な変更

**1. Type Filter追加**
```tsx
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';

const [filterType, setFilterType] = useState<'all' | 'payment' | 'collection'>('all');

// API呼び出し更新
const { data: policiesData, isLoading } = usePoliciesAPI({
  vaultId,
  type: filterType === 'all' ? undefined : filterType,
});

// UI: Type Filter Tabs
<Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
  <TabsList>
    <TabsTrigger value="all">
      All Policies ({totalCount})
    </TabsTrigger>
    <TabsTrigger value="payment">
      <DollarSign className="h-4 w-4 mr-2" />
      Payment ({paymentCount})
    </TabsTrigger>
    <TabsTrigger value="collection">
      <Users className="h-4 w-4 mr-2" />
      Collection ({collectionCount})
    </TabsTrigger>
  </TabsList>
</Tabs>
```

**2. Policy Card に Type Badge追加**
```tsx
<Card key={policy.id} className="glass border-white/10">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>{policy.name}</CardTitle>
      <div className="flex items-center gap-2">
        {/* Type Badge */}
        <Badge variant={policy.type === 'payment' ? 'default' : 'secondary'}>
          {policy.type === 'payment' ? (
            <>
              <DollarSign className="h-3 w-3 mr-1" />
              Payment
            </>
          ) : (
            <>
              <Users className="h-3 w-3 mr-1" />
              Collection
            </>
          )}
        </Badge>
        
        {/* Active Badge */}
        <Badge variant={policy.active ? 'success' : 'outline'}>
          {policy.active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground mb-4">
      {policy.description}
    </p>
    
    {/* Type-specific info */}
    {policy.type === 'payment' ? (
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Min Approvals</p>
          <p className="font-medium">{policy.threshold}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Timelock</p>
          <p className="font-medium">{policy.timelock}s</p>
        </div>
        <div>
          <p className="text-muted-foreground">Max Amount</p>
          <p className="font-medium">{policy.maxAmount || 'Unlimited'}</p>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Partial Payment</p>
          <p className="font-medium">
            {policy.collectionConfig?.allowPartialPayment ? 'Allowed' : 'Not Allowed'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Auto Complete</p>
          <p className="font-medium">
            {policy.collectionConfig?.autoComplete ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    )}
  </CardContent>
</Card>
```

**3. Count計算**
```tsx
const policies = policiesData?.policies || [];
const totalCount = policies.length;
const paymentCount = policies.filter(p => p.type === 'payment').length;
const collectionCount = policies.filter(p => p.type === 'collection').length;
```

---

### Phase 2.3: PolicyDetail.tsx - Collection設定表示

#### 必要な変更

**1. Type Discrimination**
```tsx
import type { Policy, PaymentPolicy, CollectionPolicy } from '@shared/types/policy';

// Type guard
const isPaymentPolicy = (policy: Policy): policy is PaymentPolicy => {
  return policy.type === 'payment';
};

const isCollectionPolicy = (policy: Policy): policy is CollectionPolicy => {
  return policy.type === 'collection';
};
```

**2. Payment Policy Details (既存)**
```tsx
{isPaymentPolicy(policy) && (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Payment Settings</h3>
    
    <div className="grid grid-cols-2 gap-4">
      <DetailRow
        icon={Users}
        label="Required Approvals"
        value={policy.threshold.toString()}
      />
      <DetailRow
        icon={Clock}
        label="Timelock"
        value={`${policy.timelock}s`}
      />
      <DetailRow
        icon={DollarSign}
        label="Maximum Amount"
        value={policy.maxAmount || 'Unlimited'}
      />
      <DetailRow
        icon={Shield}
        label="Roles Root"
        value={shortenAddress(policy.rolesRoot)}
      />
    </div>
  </div>
)}
```

**3. Collection Policy Details (新規)**
```tsx
{isCollectionPolicy(policy) && (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Collection Settings</h3>
    
    <div className="space-y-3">
      <DetailRow
        icon={Coins}
        label="Partial Payment"
        value={
          <Badge variant={policy.collectionConfig.allowPartialPayment ? 'success' : 'secondary'}>
            {policy.collectionConfig.allowPartialPayment ? 'Allowed' : 'Not Allowed'}
          </Badge>
        }
      />
      
      <DetailRow
        icon={CheckCircle}
        label="Auto Complete"
        value={
          <Badge variant={policy.collectionConfig.autoComplete ? 'success' : 'secondary'}>
            {policy.collectionConfig.autoComplete ? 'Enabled' : 'Disabled'}
          </Badge>
        }
      />
      
      {policy.collectionConfig.defaultDeadline && (
        <DetailRow
          icon={Calendar}
          label="Default Deadline"
          value={`${policy.collectionConfig.defaultDeadline} days`}
        />
      )}
      
      {policy.collectionConfig.reminderSettings && (
        <DetailRow
          icon={Bell}
          label="Payment Reminders"
          value={
            policy.collectionConfig.reminderSettings.enabled
              ? `${policy.collectionConfig.reminderSettings.daysBefore} days before deadline`
              : 'Disabled'
          }
        />
      )}
    </div>
  </div>
)}
```

**4. DetailRow Helper Component**
```tsx
interface DetailRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}

const DetailRow = ({ icon: Icon, label, value }: DetailRowProps) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </div>
    <div className="font-medium">{value}</div>
  </div>
);
```

---

## Phase 3: Escrow UI統合

### Phase 3.1: EscrowCreation.tsx - Type選択

#### 必要な変更

**1. Type Selector追加**
```tsx
const [escrowType, setEscrowType] = useState<'payment' | 'collection'>('payment');

<Tabs value={escrowType} onValueChange={(v) => setEscrowType(v as any)}>
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="payment">
      <Send className="h-4 w-4 mr-2" />
      Payment Request
    </TabsTrigger>
    <TabsTrigger value="collection">
      <Users className="h-4 w-4 mr-2" />
      Collection Request
    </TabsTrigger>
  </TabsList>
</Tabs>
```

**2. Policy Filtering by Type**
```tsx
const { data: policiesData } = usePoliciesAPI({
  vaultId,
  type: escrowType, // Filter policies by escrow type
  active: true,
});

<Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
  <SelectTrigger>
    <SelectValue placeholder="Select a policy..." />
  </SelectTrigger>
  <SelectContent>
    {policiesData?.policies
      .filter(p => p.type === escrowType)
      .map(policy => (
        <SelectItem key={policy.id} value={policy.id}>
          {policy.name}
        </SelectItem>
      ))}
  </SelectContent>
</Select>
```

**3. Conditional Form Rendering**
```tsx
{escrowType === 'payment' ? (
  <PaymentEscrowForm
    formData={paymentFormData}
    onChange={setPaymentFormData}
    errors={errors}
  />
) : (
  <CollectionEscrowForm
    formData={collectionFormData}
    onChange={setCollectionFormData}
    errors={errors}
  />
)}
```

**4. CollectionEscrowForm Component (新規)**
```tsx
interface CollectionEscrowFormProps {
  formData: CollectionEscrowFormData;
  onChange: (data: CollectionEscrowFormData) => void;
  errors: Record<string, string>;
}

const CollectionEscrowForm = ({ formData, onChange, errors }: CollectionEscrowFormProps) => {
  return (
    <div className="space-y-4">
      {/* Collection Name */}
      <div className="space-y-2">
        <Label>Collection Name</Label>
        <Input
          placeholder="e.g., Family Trip Fund"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
        />
      </div>

      {/* Token Selection */}
      <div className="space-y-2">
        <Label>Payment Token</Label>
        <Select
          value={formData.token}
          onValueChange={(token) => onChange({ ...formData, token })}
        >
          <SelectItem value="USDC">USDC</SelectItem>
          <SelectItem value="JPYC">JPYC</SelectItem>
        </Select>
      </div>

      {/* Participants */}
      <div className="space-y-2">
        <Label>Participants</Label>
        <ParticipantsList
          participants={formData.participants}
          onChange={(participants) => onChange({ ...formData, participants })}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onChange({
              ...formData,
              participants: [
                ...formData.participants,
                { address: '', name: '', allocatedAmount: '' },
              ],
            });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Participant
        </Button>
      </div>

      {/* Deadline */}
      <div className="space-y-2">
        <Label>Payment Deadline (Optional)</Label>
        <Input
          type="date"
          value={formData.deadline}
          onChange={(e) => onChange({ ...formData, deadline: e.target.value })}
        />
      </div>
    </div>
  );
};
```

---

### Phase 3.2: EscrowList.tsx - Type Filter表示

#### 必要な変更 (PolicyList.tsxと同様)

```tsx
const [filterType, setFilterType] = useState<'all' | 'payment' | 'collection'>('all');

const { data: escrowsData } = useEscrowsAPI({
  vaultId,
  type: filterType === 'all' ? undefined : filterType,
});

<Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
  <TabsList>
    <TabsTrigger value="all">All Escrows</TabsTrigger>
    <TabsTrigger value="payment">
      <Send className="h-4 w-4 mr-2" />
      Payments
    </TabsTrigger>
    <TabsTrigger value="collection">
      <Users className="h-4 w-4 mr-2" />
      Collections
    </TabsTrigger>
  </TabsList>
</Tabs>
```

---

## Phase 4: Collection統合

### Phase 4.1-4.3: Collection Components → Escrows API

#### 必要な変更

**CollectionList.tsx:**
```tsx
// Before
const { collections } = useCollections(vaultId);

// After
const { data: escrowsData } = useEscrowsAPI({
  vaultId,
  type: 'collection',
});
const collections = escrowsData?.escrows.filter(e => e.type === 'collection') || [];
```

**CollectionCreation.tsx:**
```tsx
// Before
const { mutate: createCollection } = useCreateCollection();

// After
const { mutate: createEscrow } = useCreateEscrowAPI();

// Submit handler
createEscrow({
  type: 'collection',
  vaultId,
  policyId, // Select from Collection Policies
  name: formData.name,
  participants: formData.participants,
  // ...
});
```

**CollectionDetail.tsx:**
```tsx
// Before
const { collection } = useCollection(collectionId);

// After
const { data: escrow } = useEscrowAPI(escrowId);
const collection = escrow?.type === 'collection' ? escrow : null;
```

---

## 実装優先順位

### 🔴 高優先度 (Week 1)
1. PolicyCreation.tsx - Collection Policy UI
2. PolicyList.tsx - Type filter

### 🟡 中優先度 (Week 2)
3. EscrowCreation.tsx - Type selection
4. EscrowList.tsx - Type filter

### 🟢 通常優先度 (Week 3)
5. Collection components統合

---

## 完了基準

### Phase 2完了
- [ ] Collection Policy作成可能
- [ ] Policy一覧でtype表示/フィルタ可能
- [ ] Policy詳細でcollection設定表示

### Phase 3完了
- [ ] Collection Escrow作成可能
- [ ] Escrow一覧でtype表示/フィルタ可能

### Phase 4完了
- [ ] Collection機能が完全にEscrows API使用
- [ ] 既存Collection UIが動作

---

## 次のアクション

1. **PolicyCreation.tsx更新** - Collection Policy UI追加
2. 動作確認・テスト
3. PolicyList.tsx更新 - Type filter追加
4. Phase 2完了後、Phase 3へ進行

---

**作成日**: 2025-10-13
**Status**: Ready for Implementation
