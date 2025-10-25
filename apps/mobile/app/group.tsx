import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

export default function GroupScreen() {
  const router = useRouter();
  const members = [
    {
      id: '1',
      address: '0x1234...5678',
      role: 'Owner',
      weight: 2,
      status: 'active',
    },
    {
      id: '2',
      address: '0xabcd...ef01',
      role: 'Guardian',
      weight: 1,
      status: 'active',
    },
    {
      id: '3',
      address: '0x9876...5432',
      role: 'Requester',
      weight: 1,
      status: 'active',
    },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Owner':
        return '#6366f1';
      case 'Guardian':
        return '#10b981';
      case 'Requester':
        return '#f59e0b';
      case 'Viewer':
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Group Members</Text>
          <Text style={styles.headerSubtitle}>{members.length} active members</Text>
        </View>

        {/* Invite Builder */}
        <View style={styles.inviteSection}>
          <Text style={styles.sectionTitle}>Invite New Member</Text>
          <TouchableOpacity style={styles.inviteButton}>
            <Text style={styles.inviteButtonIcon}>📨</Text>
            <Text style={styles.inviteButtonText}>Generate Invite Link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => router.push('/scan')}
          >
            <Text style={styles.scanButtonIcon}>📷</Text>
            <Text style={styles.scanButtonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>

        {/* Members List */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Members</Text>
          {members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {member.address.slice(2, 4).toUpperCase()}
                </Text>
              </View>

              <View style={styles.memberInfo}>
                <Text style={styles.memberAddress}>{member.address}</Text>
                <View style={styles.memberMeta}>
                  <View
                    style={[styles.roleBadge, { backgroundColor: `${getRoleColor(member.role)}20` }]}
                  >
                    <Text style={[styles.roleText, { color: getRoleColor(member.role) }]}>
                      {member.role}
                    </Text>
                  </View>
                  <Text style={styles.weightText}>Weight: {member.weight}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.menuButton}>
                <Text style={styles.menuIcon}>⋮</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Role Descriptions */}
        <View style={styles.rolesSection}>
          <Text style={styles.sectionTitle}>Role Permissions</Text>
          <View style={styles.roleCard}>
            <View style={[styles.roleIndicator, { backgroundColor: '#6366f1' }]} />
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Owner</Text>
              <Text style={styles.roleDescription}>
                Can manage all settings, approve/reject escrows
              </Text>
            </View>
          </View>
          <View style={styles.roleCard}>
            <View style={[styles.roleIndicator, { backgroundColor: '#10b981' }]} />
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Guardian</Text>
              <Text style={styles.roleDescription}>
                Can approve/reject escrows, emergency recovery
              </Text>
            </View>
          </View>
          <View style={styles.roleCard}>
            <View style={[styles.roleIndicator, { backgroundColor: '#f59e0b' }]} />
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Requester</Text>
              <Text style={styles.roleDescription}>Can create escrow requests</Text>
            </View>
          </View>
          <View style={styles.roleCard}>
            <View style={[styles.roleIndicator, { backgroundColor: '#6b7280' }]} />
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Viewer</Text>
              <Text style={styles.roleDescription}>Can only view escrow status</Text>
            </View>
          </View>
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
  inviteSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  inviteButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  inviteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
  },
  scanButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  scanButtonText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 16,
  },
  membersSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weightText: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: '#9ca3af',
  },
  rolesSection: {
    padding: 16,
  },
  roleCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});
