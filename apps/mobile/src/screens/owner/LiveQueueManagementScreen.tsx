import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  UserPlus,
  PlayCircle,
  PauseCircle,
  Users,
  Scissors,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { Booking } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { QueueTokenCard } from '../../components/QueueTokenCard';
import { AddWalkInModal } from './AddWalkInModal';
import { ConfirmationSheet } from '../../components/ConfirmationSheet';
import { RealtimeService } from '../../services/realtime';
import { api } from '../../services/api';

export const LiveQueueManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [salonName, setSalonName] = useState<string>('Live Queue');
  const [isPaused, setIsPaused] = useState(false);
  const [queueTokens, setQueueTokens] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walkInVisible, setWalkInVisible] = useState(false);

  // Destructive action confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    bookingId: string;
    action: 'skip' | 'no-show';
    tokenNumber: string;
  }>({
    visible: false,
    bookingId: '',
    action: 'skip',
    tokenNumber: '',
  });

  const fetchLiveQueue = useCallback(async () => {
    try {
      // First get owner's salon
      const meRes: any = await api.get('/auth/me');
      const ownerSalon = meRes.data?.ownedSalons?.[0];
      if (!ownerSalon) {
        Alert.alert('No Salon', 'You need to register a salon first.');
        return;
      }

      setSalonId(ownerSalon.id);
      setSalonName(ownerSalon.name);

      const qRes: any = await api.get(`/queue/salons/${ownerSalon.id}/queue`);
      if (qRes.success && qRes.data) {
        setQueueTokens(qRes.data.allTokens || []);
        setIsPaused(qRes.data.salon?.isPaused || false);
      }
    } catch (err: any) {
      console.warn('Queue error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveQueue();
  }, [fetchLiveQueue]);

  // Subscribe to live queue changes
  useEffect(() => {
    if (!salonId) return;

    const unsubscribe = RealtimeService.subscribeToSalonQueue(salonId, () => {
      fetchLiveQueue();
    });

    return () => {
      unsubscribe();
    };
  }, [salonId, fetchLiveQueue]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchLiveQueue();
  };

  const handleCall = async (bookingId: string) => {
    try {
      await api.post(`/queue/${bookingId}/call`, {});
      fetchLiveQueue();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleStart = async (bookingId: string) => {
    try {
      await api.post(`/queue/${bookingId}/start`, {});
      fetchLiveQueue();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleComplete = async (bookingId: string) => {
    try {
      await api.post(`/queue/${bookingId}/complete`, {});
      fetchLiveQueue();
      Alert.alert('Service Complete', 'Commission has been recorded to your ledger.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const executeConfirmAction = async () => {
    const { bookingId, action } = confirmModal;
    setConfirmModal({ ...confirmModal, visible: false });

    try {
      if (action === 'skip') {
        await api.post(`/queue/${bookingId}/skip`, { reason: 'Customer skipped by owner' });
      } else {
        await api.post(`/queue/${bookingId}/no-show`, { reason: 'Customer marked as no-show' });
      }
      fetchLiveQueue();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const inServiceList = queueTokens.filter((b) => b.status === 'IN_SERVICE');
  const calledList = queueTokens.filter((b) => b.status === 'CALLED');
  const waitingList = queueTokens.filter((b) =>
    ['CONFIRMED', 'CHECKED_IN', 'WAITING'].includes(b.status)
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Queue Management</Text>
        <TouchableOpacity onPress={() => setWalkInVisible(true)} style={styles.addBtn}>
          <UserPlus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Status Section 1: In Service (Chair) */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{inServiceList.length}</Text>
          </View>
          <Text style={styles.sectionTitle}>Currently In Service (In Chair)</Text>
        </View>

        {inServiceList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No customer in chair currently.</Text>
          </View>
        ) : (
          inServiceList.map((b) => (
            <QueueTokenCard
              key={b.id}
              booking={b}
              showActions
              onComplete={() => handleComplete(b.id)}
            />
          ))
        )}

        {/* Status Section 2: Called (Stepping Up) */}
        <View style={[styles.sectionHeaderRow, { marginTop: SPACING.lg }]}>
          <View style={[styles.badgeCount, { backgroundColor: '#0284C7' }]}>
            <Text style={styles.badgeCountText}>{calledList.length}</Text>
          </View>
          <Text style={styles.sectionTitle}>Called / Ready to Seat</Text>
        </View>

        {calledList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No called customer standing by.</Text>
          </View>
        ) : (
          calledList.map((b) => (
            <View key={b.id} style={styles.tokenCardWithActions}>
              <QueueTokenCard
                booking={b}
                showActions
                onStart={() => handleStart(b.id)}
              />
              <View style={styles.destructiveRow}>
                <TouchableOpacity
                  onPress={() =>
                    setConfirmModal({
                      visible: true,
                      bookingId: b.id,
                      action: 'skip',
                      tokenNumber: b.tokenNumber,
                    })
                  }
                  style={styles.skipBtn}
                >
                  <Text style={styles.skipBtnText}>Skip Token</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setConfirmModal({
                      visible: true,
                      bookingId: b.id,
                      action: 'no-show',
                      tokenNumber: b.tokenNumber,
                    })
                  }
                  style={styles.noShowBtn}
                >
                  <Text style={styles.noShowBtnText}>Mark No-Show</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Status Section 3: Waiting in Queue */}
        <View style={[styles.sectionHeaderRow, { marginTop: SPACING.lg }]}>
          <View style={[styles.badgeCount, { backgroundColor: COLORS.warning }]}>
            <Text style={styles.badgeCountText}>{waitingList.length}</Text>
          </View>
          <Text style={styles.sectionTitle}>Waiting in Line</Text>
        </View>

        {waitingList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Waiting queue is empty.</Text>
          </View>
        ) : (
          waitingList.map((b, idx) => (
            <QueueTokenCard
              key={b.id}
              booking={b}
              customersAhead={idx}
              showActions
              onCall={() => handleCall(b.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Add Walk In Modal */}
      {salonId && (
        <AddWalkInModal
          visible={walkInVisible}
          salonId={salonId}
          onClose={() => setWalkInVisible(false)}
          onSuccess={() => {
            setWalkInVisible(false);
            fetchLiveQueue();
          }}
        />
      )}

      {/* Confirmation Sheet for Destructive Action */}
      <ConfirmationSheet
        visible={confirmModal.visible}
        title={confirmModal.action === 'skip' ? 'Skip Customer?' : 'Mark Customer as No-Show?'}
        message={`Are you sure you want to mark Token ${confirmModal.tokenNumber} as ${confirmModal.action === 'skip' ? 'skipped' : 'no-show'}? This action cannot be undone.`}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badgeCount: {
    backgroundColor: COLORS.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  emptyBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  tokenCardWithActions: {
    marginBottom: SPACING.md,
  },
  destructiveRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  skipBtn: {
    padding: SPACING.xs,
  },
  skipBtnText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  noShowBtn: {
    padding: SPACING.xs,
  },
  noShowBtnText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: '600',
  },
});
