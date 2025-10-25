import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { useWalletConnect } from './hooks/useWalletConnect';
import { useRouter } from 'expo-router';
import { settingsStorage, cacheStorage } from './lib/storage';
import {
  isBiometricAvailable,
  getBiometricTypes,
  getBiometricDisplayName,
  enableBiometric as enableBiometricAuth,
  disableBiometric as disableBiometricAuth,
} from './lib/biometric';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricDisplayName, setBiometricDisplayName] = useState('Biometric');
  const router = useRouter();
  const { sessions, disconnect, getConnectedAccounts, isLoading } = useWalletConnect();

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await settingsStorage.getSettings();
      setPushEnabled(settings.pushEnabled);
      setSoundEnabled(settings.soundEnabled);
      setBiometricEnabled(settings.biometricEnabled);

      // Check biometric availability
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);

      if (available) {
        const types = await getBiometricTypes();
        const displayName = getBiometricDisplayName(types);
        setBiometricDisplayName(displayName);
      }
    };
    loadSettings();
  }, []);

  // Save settings when they change
  const updatePushEnabled = async (value: boolean) => {
    setPushEnabled(value);
    await settingsStorage.saveSettings({ pushEnabled: value });
  };

  const updateSoundEnabled = async (value: boolean) => {
    setSoundEnabled(value);
    await settingsStorage.saveSettings({ soundEnabled: value });
  };

  const updateBiometricEnabled = async (value: boolean) => {
    if (!biometricAvailable) {
      Alert.alert(
        'Not Available',
        `${biometricDisplayName} is not available on this device.`
      );
      return;
    }

    if (value) {
      // Enable biometric
      const result = await enableBiometricAuth();
      if (result.success) {
        setBiometricEnabled(true);
        await settingsStorage.saveSettings({ biometricEnabled: true });
        Alert.alert('Success', `${biometricDisplayName} enabled successfully`);
      } else {
        Alert.alert('Error', result.error || 'Failed to enable biometric');
      }
    } else {
      // Disable biometric
      const result = await disableBiometricAuth();
      if (result.success) {
        setBiometricEnabled(false);
        await settingsStorage.saveSettings({ biometricEnabled: false });
      } else {
        Alert.alert('Error', result.error || 'Failed to disable biometric');
      }
    }
  };

  const connectedAccounts = getConnectedAccounts();
  const isConnected = connectedAccounts.length > 0;
  const connectedAddress = isConnected
    ? connectedAccounts[0].split(':')[2] // Extract address from CAIP-10 format
    : null;

  const handleDisconnect = async () => {
    if (Object.keys(sessions).length === 0) return;

    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const topic = Object.keys(sessions)[0];
              await disconnect(topic);
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect wallet');
            }
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. You will need to reconnect to reload your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await cacheStorage.clearCache();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>App configuration</Text>
        </View>

        {/* WalletConnect Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet Connection</Text>
          <View style={styles.card}>
            {isConnected ? (
              <>
                <View style={styles.walletInfo}>
                  <View style={styles.walletIconContainer}>
                    <Text style={styles.walletIcon}>🔐</Text>
                  </View>
                  <View style={styles.walletDetails}>
                    <Text style={styles.walletLabel}>Connected Wallet</Text>
                    <Text style={styles.walletAddress}>
                      {connectedAddress
                        ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`
                        : '0x0000...0000'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={handleDisconnect}
                  disabled={isLoading}
                >
                  <Text style={styles.disconnectButtonText}>
                    {isLoading ? 'Disconnecting...' : 'Disconnect'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.notConnectedContainer}>
                <Text style={styles.notConnectedText}>No wallet connected</Text>
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => router.push('/scan')}
                >
                  <Text style={styles.connectButtonText}>Scan QR to Connect</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications for approvals and escrows
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={updatePushEnabled}
                trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                thumbColor={pushEnabled ? '#6366f1' : '#f4f3f4'}
              />
            </View>
            <View style={[styles.settingRow, styles.borderTop]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Sound</Text>
                <Text style={styles.settingDescription}>Play sound for notifications</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={updateSoundEnabled}
                trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                thumbColor={soundEnabled ? '#6366f1' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{biometricDisplayName} Authentication</Text>
                <Text style={styles.settingDescription}>
                  {biometricAvailable
                    ? `Use ${biometricDisplayName} to secure your wallet`
                    : 'Not available on this device'}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={updateBiometricEnabled}
                disabled={!biometricAvailable}
                trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                thumbColor={biometricEnabled ? '#6366f1' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Network Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          <View style={styles.card}>
            <View style={styles.networkInfo}>
              <View style={styles.networkIconContainer}>
                <View style={styles.networkDot} />
              </View>
              <View style={styles.networkDetails}>
                <Text style={styles.networkLabel}>Current Network</Text>
                <Text style={styles.networkValue}>Base Sepolia (Testnet)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemLabel}>Version</Text>
              <View style={styles.menuItemRight}>
                <Text style={styles.menuItemValue}>1.0.0</Text>
                <Text style={styles.menuItemChevron}>›</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.borderTop]}>
              <Text style={styles.menuItemLabel}>Documentation</Text>
              <Text style={styles.menuItemChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.borderTop]}>
              <Text style={styles.menuItemLabel}>Privacy Policy</Text>
              <Text style={styles.menuItemChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.borderTop]}>
              <Text style={styles.menuItemLabel}>Terms of Service</Text>
              <Text style={styles.menuItemChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.card, styles.dangerCard]}
            onPress={handleClearCache}
          >
            <Text style={styles.dangerText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 24,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  walletIcon: {
    fontSize: 24,
  },
  walletDetails: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  disconnectButton: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disconnectButtonText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  networkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
  },
  networkDetails: {
    flex: 1,
  },
  networkLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  networkValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    color: '#111827',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemValue: {
    fontSize: 16,
    color: '#6b7280',
    marginRight: 8,
  },
  menuItemChevron: {
    fontSize: 20,
    color: '#9ca3af',
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  dangerText: {
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  notConnectedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  notConnectedText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
