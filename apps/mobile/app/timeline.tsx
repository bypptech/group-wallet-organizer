import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function TimelineScreen() {
  const timelineEvents = [
    {
      id: '1',
      type: 'ESCROW_RELEASED',
      title: 'Groceries Released',
      amount: '50 USDC',
      recipient: '0x1234...5678',
      timestamp: '2 hours ago',
      status: 'completed',
    },
    {
      id: '2',
      type: 'APPROVAL_GRANTED',
      title: 'Monthly Allowance Approved',
      approver: '0xabcd...ef01',
      timestamp: '5 hours ago',
      status: 'approved',
    },
    {
      id: '3',
      type: 'ESCROW_CREATED',
      title: 'School Supplies Request',
      amount: '75 USDC',
      requester: '0x9876...5432',
      timestamp: '1 day ago',
      status: 'pending',
    },
    {
      id: '4',
      type: 'ESCROW_CANCELLED',
      title: 'Movie Tickets Cancelled',
      amount: '30 USDC',
      timestamp: '2 days ago',
      status: 'cancelled',
    },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ESCROW_CREATED':
        return '📝';
      case 'APPROVAL_GRANTED':
        return '✅';
      case 'ESCROW_RELEASED':
        return '🚀';
      case 'ESCROW_CANCELLED':
        return '❌';
      default:
        return '📌';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'approved':
        return '#3b82f6';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Timeline</Text>
          <Text style={styles.headerSubtitle}>Escrow history & events</Text>
        </View>

        <View style={styles.timelineContainer}>
          {timelineEvents.map((event, index) => (
            <View key={event.id} style={styles.timelineItem}>
              <View style={styles.timelineIndicator}>
                <View style={[styles.dot, { backgroundColor: getStatusColor(event.status) }]} />
                {index < timelineEvents.length - 1 && <View style={styles.line} />}
              </View>

              <View style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventIcon}>{getEventIcon(event.type)}</Text>
                  <View style={styles.eventTitleContainer}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTimestamp}>{event.timestamp}</Text>
                  </View>
                </View>

                {event.amount && (
                  <Text style={styles.eventAmount}>{event.amount}</Text>
                )}

                {event.recipient && (
                  <View style={styles.eventDetail}>
                    <Text style={styles.detailLabel}>Recipient:</Text>
                    <Text style={styles.detailValue}>{event.recipient}</Text>
                  </View>
                )}

                {event.requester && (
                  <View style={styles.eventDetail}>
                    <Text style={styles.detailLabel}>Requester:</Text>
                    <Text style={styles.detailValue}>{event.requester}</Text>
                  </View>
                )}

                {event.approver && (
                  <View style={styles.eventDetail}>
                    <Text style={styles.detailLabel}>Approver:</Text>
                    <Text style={styles.detailValue}>{event.approver}</Text>
                  </View>
                )}

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(event.status)}20` },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(event.status) }]}>
                    {event.status.toUpperCase()}
                  </Text>
                </View>
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
  timelineContainer: {
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#d1d5db',
    marginTop: 8,
  },
  eventCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  eventTitleContainer: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  eventTimestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  eventAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 8,
  },
  eventDetail: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'monospace',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
