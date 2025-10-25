import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function ApprovalsScreen() {
  const pendingApprovals = [
    {
      id: '1',
      title: 'Grocery Shopping',
      amount: '50 USDC',
      requester: '0x1234...5678',
      currentApprovals: 1,
      requiredApprovals: 2,
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      title: 'Monthly Allowance',
      amount: '100 USDC',
      requester: '0xabcd...ef01',
      currentApprovals: 0,
      requiredApprovals: 2,
      timestamp: '1 day ago',
    },
    {
      id: '3',
      title: 'School Supplies',
      amount: '75 USDC',
      requester: '0x9876...5432',
      currentApprovals: 1,
      requiredApprovals: 3,
      timestamp: '3 days ago',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pending Approvals</Text>
          <Text style={styles.headerSubtitle}>
            {pendingApprovals.length} requests waiting
          </Text>
        </View>

        <View style={styles.listContainer}>
          {pendingApprovals.map((approval) => (
            <View key={approval.id} style={styles.approvalCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.approvalTitle}>{approval.title}</Text>
                <Text style={styles.approvalAmount}>{approval.amount}</Text>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.requesterLabel}>Requested by:</Text>
                <Text style={styles.requesterAddress}>{approval.requester}</Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(approval.currentApprovals / approval.requiredApprovals) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {approval.currentApprovals}/{approval.requiredApprovals} approvals
                </Text>
              </View>

              <Text style={styles.timestamp}>{approval.timestamp}</Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.approveButton}>
                  <Text style={styles.approveButtonText}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectButton}>
                  <Text style={styles.rejectButtonText}>✕ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  listContainer: {
    padding: 16,
  },
  approvalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  approvalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  approvalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  cardBody: {
    marginBottom: 12,
  },
  requesterLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  requesterAddress: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'monospace',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
