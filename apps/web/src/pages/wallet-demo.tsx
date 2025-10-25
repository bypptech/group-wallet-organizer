import { useState, Suspense, lazy, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Web3Provider } from '@/providers/Web3Provider';
import { usePoliciesAPI, useCreatePolicyAPI } from '@/hooks/usePoliciesAPI';
import { useVaults } from '@/hooks/useVaults';
import { useAccount } from 'wagmi';
import { useDeviceAccess } from '@/hooks/useDeviceAccess';
import { UnifiedHeader } from '@/components/wallet/UnifiedHeader';
import { useDemoMode, useDefaultVaultId } from '@/hooks/useDemoMode';
import { DemoBanner } from '@/components/wallet/DemoBanner';
import { I18nextProvider } from 'react-i18next';
import i18nIot from '@/lib/i18n-iot';

// Lazy load IoT Control Panel
const IotControlPanel = lazy(() => import('@/components/iot-control/IotControlPanel').then(m => ({ default: m.IotControlPanel })));
import { ApprovalsHub } from '@/components/wallet/ApprovalsHub';
import { GroupCreation } from '@/components/wallet/GroupCreation';
import { EscrowReleaseConsole } from '@/components/wallet/EscrowReleaseConsole';
import { EscrowList } from '@/components/wallet/EscrowList';
import { EscrowDetail } from '@/components/wallet/EscrowDetail';
import { EscrowCreation } from '@/components/wallet/EscrowCreation';
import { NotificationCenter } from '@/components/wallet/NotificationCenter';
import { GroupDetail } from '@/components/wallet/GroupDetail';
import { AuditLogViewer } from '@/components/wallet/AuditLogViewer';
import { MobileView } from '@/components/wallet/MobileView';
import { AccessibilityGuide } from '@/components/wallet/AccessibilityGuide';
import { GroupList } from '@/components/wallet/GroupList';
import { ManagedGroupList } from '@/components/wallet/ManagedGroupList';
import { ManagedGroupDetail } from '@/components/wallet/ManagedGroupDetail';
import { ManagedTeamCreation } from '@/components/wallet/ManagedTeamCreation';
import { CollectionList } from '@/components/wallet/CollectionList';
import { CollectionCreation } from '@/components/wallet/CollectionCreation';
import { CollectionDetail } from '@/components/wallet/CollectionDetail';
import { CollectionPaymentDialog } from '@/components/wallet/CollectionPaymentDialog';
import { VisualViewContainer } from '@/components/wallet/visual-view';
import { ShareableKeysList } from '@/components/wallet/ShareableKeysList';
import { ShareableKeysCreation } from '@/components/wallet/ShareableKeysCreation';
import { ShareableKeysDetail } from '@/components/wallet/ShareableKeysDetail';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Eye,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Settings,
  Bell,
  Users,
  ScrollText,
  CheckSquare,
  UserPlus,
  Play,
  Accessibility,
  Smartphone,
  Wallet,
  ChevronDown,
  ChevronRight,
  Coins,
  Crown,
  LayoutList,
  LayoutGrid,
  Key,
  ArrowLeft,
  X
} from 'lucide-react';

type ScreenType =
  // Group Management
  | 'group-list'
  | 'group-creation'
  | 'group-detail'
  // Escrow Management
  | 'escrow-list'
  | 'escrow-creation'
  | 'escrow-detail'
  // Managed Teams (Collection Groups)
  | 'managed-group-list'
  | 'managed-group-creation'
  | 'managed-group-detail'
  // Collection Management
  | 'collection-list'
  | 'collection-creation'
  | 'collection-detail'
  // Shareable Keys
  | 'shareable-keys-list'
  | 'shareable-keys-creation'
  | 'shareable-keys-detail'
  // Operations & Other
  | 'approvals-hub'
  | 'escrow-release'
  | 'notifications'
  | 'audit'
  | 'accessibility'
  | 'mobile';

type ViewMode = 'list' | 'visual';

export default function WalletDemo() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('group-list');
  const [screenHistory, setScreenHistory] = useState<ScreenType[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState<string | undefined>(undefined);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | undefined>(undefined);
  const [selectedEscrowId, setSelectedEscrowId] = useState<string | undefined>(undefined);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['overview', 'group-management', 'policy-management', 'escrow']);
  const [groupCreationKey, setGroupCreationKey] = useState(0);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedShareableKeyId, setSelectedShareableKeyId] = useState<string | undefined>(undefined);
  const [showIotControl, setShowIotControl] = useState(false);

  const { address: userAddress, isConnected } = useAccount();

  // Navigate to a new screen with history tracking
  const navigateToScreen = (newScreen: ScreenType) => {
    console.log('[wallet-demo] Navigate from', currentScreen, 'to', newScreen);
    setScreenHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(newScreen);
    setShowIotControl(false); // Close IoT Control when navigating
  };

  // Navigate back to previous screen
  const navigateBack = () => {
    if (screenHistory.length > 0) {
      const previousScreen = screenHistory[screenHistory.length - 1];
      console.log('[wallet-demo] Navigate back to', previousScreen);
      setCurrentScreen(previousScreen);
      setScreenHistory(prev => prev.slice(0, -1));
    } else {
      console.log('[wallet-demo] No history, staying on', currentScreen);
    }
  };

  // Fetch vaults for visual view (will fetch demo vaults when no address)
  const { vaults } = useVaults(userAddress);

  // Demo mode support - use first vault (demo vault) when wallet is not connected
  // When wallet is not connected, vaults will contain only the demo vault
  const effectiveVaultId = selectedVaultId || (!userAddress && vaults.length > 0 ? vaults[0].id : undefined);

  // Auto-select first vault when not connected and vaults are loaded
  useEffect(() => {
    if (!userAddress && vaults.length > 0 && !selectedVaultId) {
      console.log('[wallet-demo] Auto-selecting demo vault:', vaults[0].id);
      setSelectedVaultId(vaults[0].id);
      // Automatically navigate to group detail to show demo data
      setCurrentScreen('group-detail');
    }
  }, [userAddress, vaults, selectedVaultId]);

  // ウォレット切断時にIoT Controlパネルを閉じる
  useEffect(() => {
    if (!isConnected) {
      setShowIotControl(false);
    }
  }, [isConnected]);

  // Fetch policies from API
  const { data: policiesData } = usePoliciesAPI();
  const createPolicyMutation = useCreatePolicyAPI();

  // Get current vault for demo mode detection
  const currentVault = vaults?.find(v => v.id === effectiveVaultId);
  const { isDemo, canPerformAction, demoMessage } = useDemoMode(currentVault);

  // Fetch device access permissions
  const { hasAccessToDevice, hasAnyAccess, devices, keys: deviceKeys, isLoading: isLoadingDeviceAccess } = useDeviceAccess();

  // Debug: Log device access info
  const shouldShowDevicePanel = !isLoadingDeviceAccess && isConnected && !!userAddress;
  console.log('[wallet-demo] Device Access:', {
    devices,
    deviceKeys,
    hasAnyAccess: hasAnyAccess(),
    hasDevice01: hasAccessToDevice('device01'),
    hasDevice02: hasAccessToDevice('device02'),
    isLoading: isLoadingDeviceAccess,
    isConnected,
    userAddress,
    shouldShowDevicePanel,
  });

  // Get active key ID for device tracking (use first active key)
  const activeDeviceKey = deviceKeys?.find(k => k.keyStatus === 'active' && k.authStatus === 'active');

  // Filter vaults for My Teams (exclude collection-group)
  const myTeamVaults = vaults.filter(vault => vault.metadata?.type !== 'collection-group');

  // Filter vaults for Managed Teams (only collection-group)
  const managedTeamVaults = vaults.filter(vault => vault.metadata?.type === 'collection-group');

  const menuCategories = [
    {
      id: 'group-management',
      label: 'Team Pay',
      icon: Users,
      screen: 'group-list' as ScreenType,
    },
    {
      id: 'collection',
      label: 'Pay First',
      icon: Crown,
      screen: 'managed-group-list' as ScreenType,
    },
    {
      id: 'shareable-keys',
      label: 'Share Keys',
      icon: Key,
      screen: 'shareable-keys-list' as ScreenType,
    },
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const renderContent = () => {
    console.log('[wallet-demo] renderContent called, currentScreen:', currentScreen, 'selectedVaultId:', selectedVaultId);
    switch (currentScreen) {
      // Group Management
      case 'group-list':
        if (viewMode === 'visual') {
          return <VisualViewContainer
            vaults={myTeamVaults}
            type="my-team"
            onCardAction={(action, vaultId) => {
              console.log('[wallet-demo] Visual view action:', action, 'vaultId:', vaultId);
              if (action === 'deposit' || action === 'withdraw') {
                setSelectedVaultId(vaultId);
                setCurrentScreen('group-detail');
              } else if (action === 'invite') {
                // Handle invite action if needed
                console.log('[wallet-demo] Invite action for vault:', vaultId);
              }
            }}
          />;
        }
        return <GroupList
          onNavigateToDetail={(vaultId) => {
            console.log('[wallet-demo] onNavigateToDetail called with vaultId:', vaultId);
            console.log('[wallet-demo] vaultId type:', typeof vaultId, 'length:', vaultId?.length);
            setSelectedVaultId(vaultId);
            setCurrentScreen('group-detail');
            console.log('[wallet-demo] State updated - selectedVaultId:', vaultId, 'currentScreen: group-detail');
          }}
          onNavigateToCreate={() => {
            setGroupCreationKey(prev => prev + 1);
            setCurrentScreen('group-creation');
          }}
          onNavigateToShareableKeys={(vaultId) => {
            console.log('[wallet-demo] onNavigateToShareableKeys called with vaultId:', vaultId);
            setSelectedVaultId(vaultId);
            setCurrentScreen('shareable-keys-list');
          }}
          onOpenDeviceControl={(keyId, keyName) => {
            console.log('[wallet-demo] onOpenDeviceControl called with keyId:', keyId, 'keyName:', keyName);
            setSelectedShareableKeyId(keyId);
            setShowIotControl(true);
          }}
        />;
      case 'group-creation':
        return <GroupCreation
          key={`group-creation-${groupCreationKey}`}
          vaultId={undefined}  // TODO: Pass actual vault.id (UUID) instead of hardcoded address
          onGroupCreated={(vaultId, vaultData) => {
            console.log('[wallet-demo] onGroupCreated called with vaultId:', vaultId);
            // Navigate to My Groups list IMMEDIATELY
            setSelectedVaultId(vaultId);
            setCurrentScreen('group-list');
            console.log('[wallet-demo] Screen changed to group-list');

            // Auto-create policy for the new vault in background (non-blocking)
            (async () => {
              try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

                // Get requiredWeight and timelock from vaultData metadata
                const requiredWeight = vaultData?.metadata?.requiredWeight || 1;
                const timelock = vaultData?.metadata?.timelock || 0;

                // Generate policy ID (bytes32 hex) from timestamp and random bytes
                const timestamp = Date.now().toString(16).padStart(16, '0');
                const randomBytes = Array.from({ length: 24 }, () =>
                  Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
                ).join('');
                const policyId = `0x${timestamp}${randomBytes}`;

                // Generate dummy Merkle roots
                const rolesRoot = '0x0000000000000000000000000000000000000000000000000000000000000000';
                const ownersRoot = '0x1111111111111111111111111111111111111111111111111111111111111111';

                const policyPayload = {
                  policyId,
                  vaultId,
                  threshold: requiredWeight,
                  timelock,
                  rolesRoot,
                  ownersRoot,
                  maxAmount: '1000000000000000000000', // 1000 tokens (18 decimals)
                  active: true,
                  metadata: {
                    name: vaultData?.name || 'Default Policy',
                    description: vaultData?.description || 'Auto-generated policy'
                  }
                };

                console.log('[wallet-demo] Auto-creating policy for new vault:', policyPayload);

                const response = await fetch(`${API_BASE_URL}/policies`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(policyPayload),
                });

                if (!response.ok) {
                  console.error('[wallet-demo] Failed to auto-create policy:', await response.text());
                } else {
                  console.log('[wallet-demo] Policy auto-created successfully');
                }
              } catch (error) {
                console.error('[wallet-demo] Error auto-creating policy:', error);
              }
            })();
          }}
        />;
      case 'group-detail':
        console.log('[wallet-demo] Rendering GroupDetail with vaultId:', selectedVaultId);
        if (!selectedVaultId) {
          console.error('[wallet-demo] ERROR: selectedVaultId is undefined!');
        }
        return (
          <GroupDetail
            vaultId={selectedVaultId}
            onNavigateToEscrowCreation={(vaultId) => {
              console.log('[wallet-demo] Navigate to Escrow Creation from Group:', vaultId);
              setSelectedVaultId(vaultId);
              setCurrentScreen('escrow-creation');
            }}
            onNavigateToEscrowDetail={(escrowId) => {
              console.log('[wallet-demo] Navigate to Escrow Detail from Group:', escrowId);
              setSelectedEscrowId(escrowId);
              navigateToScreen('escrow-detail');
            }}
            onNavigateToEscrowList={(vaultId) => {
              console.log('[wallet-demo] Navigate to Escrow List from Group:', vaultId);
              setSelectedVaultId(vaultId);
              setCurrentScreen('escrow-list');
            }}
            onNavigateToPolicyList={(vaultId) => {
              console.log('[wallet-demo] Navigate to Policy List from Group:', vaultId);
              setSelectedVaultId(vaultId);
              setCurrentScreen('policy-list');
            }}
            onNavigateToShareableKeyDetail={(keyId) => {
              console.log('[wallet-demo] Navigate to Shareable Key Detail from Group:', keyId);
              setSelectedShareableKeyId(keyId);
              navigateToScreen('shareable-keys-detail');
            }}
            onNavigateToIotControl={(deviceId) => {
              console.log('[wallet-demo] Navigate to IoT Control from Group:', deviceId);
              // Same behavior as key icon - show IoT control in main content area
              setShowIotControl(true);
            }}
            onNavigateBack={() => {
              console.log('[wallet-demo] Navigate back to group list');
              setCurrentScreen('group-list');
            }}
          />
        );

      // Escrow Management
      case 'escrow-list':
        return <EscrowList
          vaultId={selectedVaultId}
          onCreateEscrow={() => setCurrentScreen('escrow-creation')}
          onEscrowClick={(escrowId) => {
            console.log('[wallet-demo] Viewing escrow:', escrowId);
            setCurrentScreen('escrow-detail');
          }}
          onBackToGroup={() => {
            if (selectedVaultId) {
              setCurrentScreen('group-detail');
            } else {
              setCurrentScreen('group-list');
            }
          }}
        />;
      case 'escrow-creation':
        // Show warning if no vault is selected
        if (!selectedVaultId) {
          return (
            <div className="p-6">
              <Card className="glass border-white/10">
                <CardContent className="p-12 text-center">
                  <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Group Selected
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Please select a group from My Groups before creating an escrow
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => setCurrentScreen('group-list')}
                      className="gradient-primary text-white hover-glow"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Go to My Groups
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentScreen('escrow-list')}
                    >
                      Back to Escrows
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }

        // Check if payment policies exist for this vault
        return <EscrowCreationWithPolicyCheck
          vaultId={selectedVaultId}
          defaultPolicyId={selectedPolicyId}
          onSuccess={() => {
            console.log('[wallet-demo] Escrow created successfully, navigating to list');
            setCurrentScreen('escrow-list');
          }}
          onCancel={() => {
            console.log('[wallet-demo] Escrow creation cancelled, navigating to list');
            setCurrentScreen('escrow-list');
          }}
          onNavigateToPolicyCreation={() => {
            console.log('[wallet-demo] Navigating to policy creation');
            setCurrentScreen('policy-creation');
          }}
        />;
      case 'escrow-detail':
        return (
          <EscrowDetail
            escrowId={selectedEscrowId}
            onBack={navigateBack}
          />
        );

      // Managed Teams (for Collections)
      case 'managed-group-list':
        if (viewMode === 'visual') {
          return <VisualViewContainer
            vaults={managedTeamVaults}
            type="managed-team"
            onCardAction={(action, vaultId) => {
              console.log('[wallet-demo] Visual view action:', action, 'vaultId:', vaultId);
              if (action === 'deposit' || action === 'withdraw') {
                setSelectedVaultId(vaultId);
                setCurrentScreen('managed-group-detail');
              } else if (action === 'invite') {
                // Handle invite action if needed
                console.log('[wallet-demo] Invite action for managed team:', vaultId);
              }
            }}
          />;
        }
        return <ManagedGroupList
          onNavigateToDetail={(vaultId) => {
            console.log('[wallet-demo] Navigate to managed group detail, vaultId:', vaultId);
            setSelectedVaultId(vaultId);
            setCurrentScreen('managed-group-detail');
          }}
          onNavigateToCreate={() => {
            setGroupCreationKey(prev => prev + 1);
            setCurrentScreen('managed-group-creation');
          }}
        />;
      case 'managed-group-creation':
        // Unified form for creating Managed Team + First Collection
        console.log('[wallet-demo] Rendering ManagedTeamCreation (UNIFIED FORM)');
        return <ManagedTeamCreation
          onTeamCreated={(vaultId, collectionId) => {
            console.log('[wallet-demo] Managed team created, vaultId:', vaultId, 'collectionId:', collectionId);
            setSelectedVaultId(vaultId);
            setSelectedCollectionId(collectionId);
            // Navigate to the managed group detail to show the new team
            setCurrentScreen('managed-group-detail');
          }}
          onCancel={() => {
            setCurrentScreen('managed-group-list');
          }}
        />;
      case 'managed-group-detail':
        console.log('[wallet-demo] Rendering managed-group-detail with vaultId:', selectedVaultId);
        if (!selectedVaultId) {
          console.error('[wallet-demo] ERROR: selectedVaultId is undefined for managed-group-detail!');
        }
        return (
          <ManagedGroupDetail
            vaultId={selectedVaultId}
            onNavigateToList={() => setCurrentScreen('managed-group-list')}
            onNavigateToCollectionDetail={(collectionId) => {
              setSelectedCollectionId(collectionId);
              setCurrentScreen('collection-detail');
            }}
            onNavigateToCollectionCreation={() => {
              console.log('[wallet-demo] Navigating to collection-creation from managed-group-detail, selectedVaultId:', selectedVaultId);
              setCurrentScreen('collection-creation');
            }}
          />
        );

      // Collection Management
      case 'collection-list':
        return <CollectionList
          vaultId={selectedVaultId}
          onNavigateToDetail={(collectionId) => {
            setSelectedCollectionId(collectionId);
            setCurrentScreen('collection-detail');
          }}
          onNavigateToCreate={() => {
            console.log('[wallet-demo] Navigating to collection-creation, selectedVaultId:', selectedVaultId);
            setCurrentScreen('collection-creation');
          }}
        />;
      case 'collection-creation':
        if (!selectedVaultId) {
          console.error('[wallet-demo] ERROR: No vault selected for collection creation');
          return (
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-white">No Vault Selected</h2>
              <p className="text-muted-foreground">Please select a vault first before creating a collection.</p>
              <Button onClick={() => setCurrentScreen('group-list')}>
                Go to Team List
              </Button>
            </div>
          );
        }
        return <CollectionCreation
          vaultId={selectedVaultId}
          onCollectionCreated={(collectionId) => {
            setSelectedCollectionId(collectionId);
            setCurrentScreen('collection-detail');
          }}
        />;
      case 'collection-detail':
        return <CollectionDetail
          collectionId={selectedCollectionId || ''}
          onBack={() => setCurrentScreen('collection-list')}
          onRecordPayment={(participantAddress) => {
            console.log('Record payment for:', participantAddress);
          }}
        />;

      // Operations & Other
      case 'approvals-hub':
        return <ApprovalsHub />;
      case 'escrow-release':
        return <EscrowReleaseConsole />;
      case 'notifications':
        return <NotificationCenter />;
      case 'audit':
        return <AuditLogViewer />;
      case 'accessibility':
        return <AccessibilityGuide />;
      case 'mobile':
        return <MobileView />;

      // Shareable Keys
      case 'shareable-keys-list':
        return <ShareableKeysList
          onNavigateToCreation={() => setCurrentScreen('shareable-keys-creation')}
          onNavigateToDetail={(keyId) => {
            setSelectedShareableKeyId(keyId);
            setCurrentScreen('shareable-keys-detail');
          }}
          onNavigateToTeamPay={() => setCurrentScreen('group-list')}
          hasTeams={myTeamVaults.length > 0}
          filterVaultId={selectedVaultId}
        />;
      case 'shareable-keys-creation':
        return <ShareableKeysCreation
          onBack={() => setCurrentScreen('shareable-keys-list')}
          onComplete={(keyId) => {
            setSelectedShareableKeyId(keyId);
            setCurrentScreen('shareable-keys-detail');
          }}
        />;
      case 'shareable-keys-detail':
        return <ShareableKeysDetail
          keyId={selectedShareableKeyId || ''}
          onBack={navigateBack}
          onNavigateToIotControl={(deviceId) => {
            console.log('[wallet-demo] Navigate to IoT Control from ShareableKeysDetail:', deviceId);
            // Set all states in the correct order
            setShowIotControl(true);
            setSelectedDeviceId(deviceId);
            navigateToScreen('group-list');
          }}
        />;

      // IoT Control
      case 'iot-control':
        return (
          <Card className="glass-card border-2 border-amber-500/50">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 shadow-lg">
                      <Smartphone className="h-8 w-8 text-amber-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        ESP32 IoT Control
                      </h2>
                      <p className="text-sm text-white/60">
                        Control your IoT devices remotely
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      Live
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (selectedVaultId) {
                          setCurrentScreen('group-detail');
                        } else {
                          setCurrentScreen('shareable-keys-list');
                        }
                      }}
                      className="text-white/80 hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  </div>
                </div>

                {/* IoT Control Panel Component */}
                <I18nextProvider i18n={i18nIot}>
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-[600px]">
                      <div className="text-white text-center">
                        <div className="h-16 w-16 mx-auto mb-4 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <p>Loading IoT Control Panel...</p>
                      </div>
                    </div>
                  }>
                    <IotControlPanel />
                  </Suspense>
                </I18nextProvider>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return <EscrowList />;
    }
  };

  return (
    <Web3Provider>
      <div className="min-h-screen bg-background">
        {/* Demo Mode Banner */}
        <DemoBanner vault={currentVault} />

        <div className="container mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
          {/* Unified Header */}
          <UnifiedHeader />

          {/* Screen Navigation with Categories */}
          <div className="relative overflow-hidden rounded-lg border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-px">
            <div className="bg-background rounded-md p-3 sm:p-4 lg:p-6">
              {/* Main Action Buttons - Team Pay with Share Keys, and Pay First */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6">
                {menuCategories.map((category, index) => {
                  const CategoryIcon = category.icon;
                  const isActive = currentScreen === category.screen;

                  // Skip Share Keys as it will be rendered inside Team Pay
                  if (category.id === 'shareable-keys') return null;

                  // Combined Team Pay and Share Keys banner (split 50/50 with center divider)
                  if (category.id === 'group-management') {
                    const shareKeysCategory = menuCategories.find(c => c.id === 'shareable-keys');
                    const ShareKeysIcon = shareKeysCategory?.icon;
                    const isShareKeysActive = currentScreen === 'shareable-keys-list';

                    return (
                      <motion.div
                        key={category.id}
                        className="relative overflow-hidden rounded-xl border-[3px] border-white/10 hover:border-white/30 transition-all duration-300"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.15,
                          ease: [0.4, 0, 0.2, 1]
                        }}
                      >
                        <div className="grid grid-cols-2 relative">
                          {/* Center divider line with top/bottom spacing */}
                          <div className="absolute left-1/2 top-6 bottom-6 w-px bg-white/20 -translate-x-1/2 z-20" />

                          {/* Left Half - Team Pay */}
                          <motion.button
                            onClick={() => {
                              setCurrentScreen(category.screen);
                              setShowIotControl(false);
                            }}
                            className={`relative overflow-hidden p-6 sm:p-8 lg:p-10 transition-all duration-300 group ${
                              isActive
                                ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30'
                                : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20'
                            }`}
                            whileHover={{
                              scale: 1.02,
                              transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Animated background gradient */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/20 to-blue-500/0"
                              animate={{
                                x: ['-100%', '100%'],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                            />

                            <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4">
                              {/* Icon */}
                              <motion.div
                                className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 shadow-lg"
                                whileHover={{
                                  rotate: [0, -5, 5, -5, 0],
                                  transition: { duration: 0.5 }
                                }}
                              >
                                <CategoryIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-cyan-300" />
                              </motion.div>

                              {/* Label */}
                              <div className="text-center">
                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">
                                  {category.label}
                                </h3>
                                <p className="text-sm sm:text-base lg:text-lg text-white/60 group-hover:text-white/80 transition-colors">
                                  Manage your vault teams
                                </p>
                              </div>

                              {/* Arrow indicator */}
                              <motion.div
                                className="mt-2"
                                animate={{
                                  x: [0, 5, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }}
                              >
                                <ChevronRight className={`h-5 w-5 sm:h-6 sm:w-6 ${
                                  isActive ? 'text-blue-300' : 'text-white/40 group-hover:text-white/70'
                                } transition-colors`} />
                              </motion.div>
                            </div>
                          </motion.button>

                          {/* Right Half - Share Keys */}
                          <motion.button
                            onClick={() => {
                              setCurrentScreen('shareable-keys-list');
                              setShowIotControl(false);
                            }}
                            className={`relative overflow-hidden p-6 sm:p-8 lg:p-10 transition-all duration-300 group ${
                              isShareKeysActive
                                ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30'
                                : 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20'
                            }`}
                            whileHover={{
                              scale: 1.02,
                              transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Animated background */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0"
                              animate={{
                                x: ['-100%', '100%'],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                            />

                            <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4">
                              {/* Icon */}
                              <motion.div
                                className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 shadow-lg"
                                whileHover={{
                                  rotate: [0, -5, 5, -5, 0],
                                  transition: { duration: 0.5 }
                                }}
                              >
                                {ShareKeysIcon && <ShareKeysIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-amber-300" />}
                              </motion.div>

                              {/* Label */}
                              <div className="text-center">
                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">
                                  {shareKeysCategory?.label}
                                </h3>
                                <p className="text-sm sm:text-base lg:text-lg text-white/60 group-hover:text-white/80 transition-colors">
                                  Secure key sharing and Access devices
                                </p>
                              </div>

                              {/* Arrow indicator */}
                              <motion.div
                                className="mt-2"
                                animate={{
                                  x: [0, 5, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }}
                              >
                                <ChevronRight className={`h-5 w-5 sm:h-6 sm:w-6 ${
                                  isShareKeysActive ? 'text-amber-300' : 'text-white/40 group-hover:text-white/70'
                                } transition-colors`} />
                              </motion.div>
                            </div>
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  }

                  // Pay First banner (normal rendering)
                  return (
                    <motion.button
                      key={category.id}
                      onClick={() => {
                        if ('screen' in category) {
                          setCurrentScreen(category.screen);
                          setShowIotControl(false);
                        }
                      }}
                      className={`relative overflow-hidden rounded-xl p-6 sm:p-8 lg:p-10 transition-all duration-300 group ${
                        isActive
                          ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-[3px] border-purple-400/50 shadow-lg shadow-purple-500/20'
                          : 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-[3px] border-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-purple-500/10'
                      }`}
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.15,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Animated background gradient */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/20 to-purple-500/0"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />

                      <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4">
                        {/* Icon */}
                        <motion.div
                          className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 shadow-lg"
                          whileHover={{
                            rotate: [0, -5, 5, -5, 0],
                            transition: { duration: 0.5 }
                          }}
                        >
                          <CategoryIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-pink-300" />
                        </motion.div>

                        {/* Label */}
                        <div className="text-center">
                          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">
                            {category.label}
                          </h3>
                          <p className="text-sm sm:text-base lg:text-lg text-white/60 group-hover:text-white/80 transition-colors">
                            You pay first, then collect from team members
                          </p>
                        </div>

                        {/* Arrow indicator */}
                        <motion.div
                          className="mt-2"
                          animate={{
                            x: [0, 5, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          <ChevronRight className={`h-5 w-5 sm:h-6 sm:w-6 ${
                            isActive ? 'text-pink-300' : 'text-white/40 group-hover:text-white/70'
                          } transition-colors`} />
                        </motion.div>
                      </div>

                    </motion.button>
                  );
                })}
              </div>

              {/* View Mode Toggle - Show only on group-list and managed-group-list screens */}
              {(currentScreen === 'group-list' || currentScreen === 'managed-group-list') && (
                <div className="flex justify-center mb-6">
                  <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        viewMode === 'list'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      <LayoutList className="h-4 w-4" />
                      List View
                    </button>
                    <button
                      onClick={() => setViewMode('visual')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        viewMode === 'visual'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Visual View
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {menuCategories.map((category, index) => {
                  const CategoryIcon = category.icon;
                  const isExpanded = expandedCategories.includes(category.id);

                  return (
                    <motion.div
                      key={category.id}
                      className="space-y-2 hidden"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      {/* Category Header - Hidden but kept for compatibility */}
                      <button
                        onClick={() => {
                          // If category has a screen property, navigate directly
                          if ('screen' in category) {
                            setCurrentScreen(category.screen);
                          } else {
                            toggleCategory(category.id);
                          }
                        }}
                        className="w-full flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold hover:bg-white/5 rounded-lg p-2 transition-all group"
                      >
                        <div className={`p-1.5 sm:p-2 rounded-lg ${
                          category.id === 'approvals'
                            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
                            : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                        }`}>
                          <CategoryIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                            category.id === 'approvals' ? 'text-green-400' : 'text-blue-400'
                          }`} />
                        </div>
                        <span className="flex-1 text-left text-white group-hover:text-white/80 transition-colors">{category.label}</span>
                        {'items' in category && (
                          isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-white/60" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-white/60" />
                          )
                        )}
                      </button>

                      {/* Category Items */}
                      {isExpanded && 'items' in category && (
                        <div className="flex flex-wrap gap-2 pl-4 sm:pl-6">
                          {category.items.map((item) => {
                            const ItemIcon = item.icon;
                            const isTeamList = item.id === 'collection-list' || item.id === 'group-list';
                            return (
                              <Button
                                key={item.id}
                                variant={currentScreen === item.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentScreen(item.id)}
                                className={`gap-1.5 sm:gap-2 text-xs sm:text-sm ${
                                  isTeamList
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600'
                                    : ''
                                }`}
                              >
                                <ItemIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden xs:inline sm:inline">{item.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content - Hidden when IoT Control is shown */}
          {!showIotControl && (
            <div className="relative overflow-hidden rounded-lg border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-px">
              <div className="bg-background rounded-md p-4 sm:p-6">
                {renderContent()}
              </div>
            </div>
          )}

          {/* ESP32 IoT Control Card - Conditional Display */}
          {showIotControl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative overflow-hidden rounded-lg border-2 border-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 p-px"
            >
            <Card className="bg-background rounded-md border-0">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowIotControl(false)}
                        className="shrink-0 text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <X className="h-6 w-6" />
                      </Button>
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 shadow-lg">
                        <Smartphone className="h-8 w-8 text-amber-300" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                          ESP32 IoT Control
                        </h2>
                        <p className="text-sm text-white/60">
                          Control your IoT devices remotely
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      Live
                    </Badge>
                  </div>

                  {/* IoT Control Panel Component */}
                  <div className="relative w-full rounded-xl overflow-hidden border-2 border-white/10 bg-black/20 p-6">
                    <I18nextProvider i18n={i18nIot}>
                      <Suspense fallback={
                        <div className="flex items-center justify-center h-[600px]">
                          <div className="text-white text-center">
                            <div className="h-16 w-16 mx-auto mb-4 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            <p>Loading IoT Control Panel...</p>
                          </div>
                        </div>
                      }>
                        <IotControlPanel
                          keyId={activeDeviceKey?.keyId}
                          userAddress={userAddress}
                          deviceId={activeDeviceKey?.device}
                        />
                      </Suspense>
                    </I18nextProvider>
                  </div>

                  {/* Footer info - removed API endpoint display */}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )}
        </div>
      </div>
    </Web3Provider>
  );
}

// Helper component to check for payment policies before showing escrow creation
interface EscrowCreationWithPolicyCheckProps {
  vaultId: string;
  defaultPolicyId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onNavigateToPolicyCreation?: () => void;
}

function EscrowCreationWithPolicyCheck({
  vaultId,
  defaultPolicyId,
  onSuccess,
  onCancel,
  onNavigateToPolicyCreation,
}: EscrowCreationWithPolicyCheckProps) {
  // Fetch payment policies for this vault
  const { data: policiesData, isLoading } = usePoliciesAPI({
    vaultId,
    type: 'payment',
  });

  const paymentPolicies = policiesData?.policies || [];
  const hasPaymentPolicies = paymentPolicies.length > 0;

  console.log('[EscrowCreationWithPolicyCheck]', {
    vaultId,
    isLoading,
    paymentPoliciesCount: paymentPolicies.length,
    hasPaymentPolicies,
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="glass border-white/10">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Checking Payment Policies...
            </h3>
            <p className="text-muted-foreground">
              Verifying group configuration
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // NOTE: Policy check removed - users can now create policies during escrow creation
  // The EscrowCreation component has integrated PolicyCreationModal (Option B flow)
  // No need to block escrow creation if no policies exist

  // Show the escrow creation form directly
  return (
    <EscrowCreation
      vaultId={vaultId}
      defaultPolicyId={defaultPolicyId}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}
