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
  Clock,
  Users,
  CheckCircle,
  TrendingUp,
  UserPlus,
  PlayCircle,
  PauseCircle,
  Scissors,
  Briefcase,
  Sliders,
  DollarSign,
  AlertCircle,
} from 'lucide-react-native';
import { Booking } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme';
import { QueueTokenCard } from '../../components/QueueTokenCard';
import { StatusBadge } from '../../components/StatusBadge';
import { AddWalkInModal } from './AddWalkInModal';
import { ConfirmationSheet } from '../../components/ConfirmationSheet';
import { api } from '../../services/api';

export const OwnerDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walkInModalVisible, setWalkInModalVisible] = useState(false);
  const [pauseModalVisible, setPauseModalVisible] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res: any = await api.get('/owner/dashboard');
      if (res.success && res.data) {
        setDashboard(res.data);
      }
    } catch (err: any) {
      console.warn('Dashboard error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
  };

  const handleTogglePause = async () => {
    if (!dashboard?.salon?.id) return;
    try {
      if (dashboard.salon.isPaused) {
        await api.post('/queue/resume', { salonId: dashboard.salon.id });
      } else {
        await api.post('/queue/pause', {
          salonId: dashboard.salon.id,
          reason: 'Temporary pause by salon manager',
        });
      }
      setPauseModalVisible(false);
      fetchDashboard();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not toggle queue pause');
    }
  };

  const handleCallNext = async (bookingId: string) => {
    try {
      await api.post(`/queue/${bookingId}/call`, {});
      fetchDashboard();
      Alert.alert('Customer Called', 'Customer notified to proceed to chair.');
    } catch (err: any) {
      Alert.alert('Action Failed', err.message);
    }
  };

  const handleStartService = async (bookingId: string) => {
    try {
      await api.post(`/queue/${bookingId}/start`, {});
      fetchDashboard();
    } catch (err: any) {
      Alert.alert('Action Failed', err.message);
    }
  };

  const handleCompleteService = async (bookingId: string) => {
    try {
      await api.post(`/queue/${bookingId}/complete`, {});
      fetchDashboard();
      Alert.alert('Service Completed', 'Session concluded and commission recorded.');
    } catch (err: any) {
      Alert.alert('Action Failed', err.message);
    }
  };

  const metrics = dashboard?.metrics;
  const nextCustomer = dashboard?.nextCustomer;
  const isPaused = dashboard?.salon?.isPaused;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.salonName}>{dashboard?.salon?.name || 'My Salon'}</Text>
          <Text style={styles.roleTitle}>Salon Owner Dashboard</Text>
        </View>

        {/* Queue Status Switch Pill */}
        <TouchableOpacity
          onPress={() => setPauseModalVisible(true)}
          style={[styles.pausePill, isPaused ? styles.pausedPillBg : styles.activePillBg]}
        >
          {isPaused ? (
            <>
              <PauseCircle size={14} color="#B45309" style={{ marginRight: 4 }} />
              <Text style={styles.pausedText}>Queue Paused</Text>
            </>
          ) : (
            <>
              <PlayCircle size={14} color={COLORS.success} style={{ marginRight: 4 }} />
              <Text style={styles.activeText}>Queue Active</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          {/* Waiting Count */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: COLORS.warningLight }]}>
              <Clock size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.metricNumber}>{metrics?.waitingCount ?? 0}</Text>
            <Text style={styles.metricTitle}>Waiting Customers</Text>
          </View>

          {/* In Service Count */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <Scissors size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.metricNumber}>{metrics?.inServiceCount ?? 0}</Text>
            <Text style={styles.metricTitle}>In Service (Chair)</Text>
          </View>

          {/* Completed Count */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: COLORS.successLight }]}>
              <CheckCircle size={20} color={COLORS.success} />
            </View>
            <Text style={styles.metricNumber}>{metrics?.completedCount ?? 0}</Text>
            <Text style={styles.metricTitle}>Completed Today</Text>
          </View>

          {/* Est Today Revenue */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <TrendingUp size={20} color="#0284C7" />
            </View>
            <Text style={styles.metricNumber}>₹{metrics?.todayEstimatedRevenue ?? 0}</Text>
            <Text style={styles.metricTitle}>Today's Revenue</Text>
          </View>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            onPress={() => setWalkInModalVisible(true)}
            style={styles.actionButton}
          >
            <UserPlus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionButtonText}>Add Walk-in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('LiveQueueManagement')}
            style={styles.secondaryActionBtn}
          >
            <Clock size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.secondaryActionText}>Full Queue</Text>
          </TouchableOpacity>
        </View>

        {/* Next Customer Up Highlight */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Up Next in Line</Text>
        </View>

        {nextCustomer ? (
          <QueueTokenCard
            booking={nextCustomer}
            showActions
            onCall={() => handleCallNext(nextCustomer.id)}
            onStart={() => handleStartService(nextCustomer.id)}
            onComplete={() => handleCompleteService(nextCustomer.id)}
          />
        ) : (
          <View style={styles.emptyNextBox}>
            <Text style={styles.emptyNextText}>No customers waiting in line right now.</Text>
          </View>
        )}

        {/* Business & Staff Management Links */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Salon Management</Text>
        </View>

        <View style={styles.managementList}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ServicesManagement', { salonId: dashboard?.salon?.id })}
            style={styles.mgmtRow}
          >
            <Scissors size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.mgmtTitle}>Services & Pricing</Text>
              <Text style={styles.mgmtSubtitle}>Manage haircut, beard, and grooming menu</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('StaffManagement', { salonId: dashboard?.salon?.id })}
            style={styles.mgmtRow}
          >
            <Users size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.mgmtTitle}>Staff & Barbers</Text>
              <Text style={styles.mgmtSubtitle}>
                {metrics?.availableBarbersCount ?? 0} of {metrics?.totalBarbersCount ?? 0} barbers available
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('OwnerCommission')}
            style={styles.mgmtRow}
          >
            <DollarSign size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.mgmtTitle}>Platform Commission</Text>
              <Text style={styles.mgmtSubtitle}>
                Pending platform fee: ₹{dashboard?.commission?.totalDue ?? 0}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Walk-In Modal */}
      {dashboard?.salon?.id && (
        <AddWalkInModal
          visible={walkInModalVisible}
          salonId={dashboard.salon.id}
          onClose={() => setWalkInModalVisible(false)}
          onSuccess={() => {
            setWalkInModalVisible(false);
            fetchDashboard();
          }}
        />
      )}

      {/* Pause/Resume Queue Confirmation */}
      <ConfirmationSheet
        visible={pauseModalVisible}
        title={isPaused ? 'Resume Bookings?' : 'Pause New Bookings?'}
        message={
          isPaused
            ? 'Resuming will allow new online customers to book tokens again.'
            : 'Pausing stops new incoming bookings. Existing queue tokens are not affected.'
        }
        confirmLabel={isPaused ? 'Resume Queue' : 'Pause Queue'}
        cancelLabel="Cancel"
        isDestructive={!isPaused}
        onConfirm={handleTogglePause}
        onCancel={() => setPauseModalVisible(false)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  salonName: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
  },
  roleTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  pausePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  activePillBg: {
    backgroundColor: COLORS.successLight,
  },
  pausedPillBg: {
    backgroundColor: COLORS.warningLight,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  pausedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metricCard: {
    width: '47.5%',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    flex: 1,
    height: 46,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryActionBtn: {
    flex: 1,
    height: 46,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  emptyNextBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyNextText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  managementList: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  mgmtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  mgmtTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
  },
  mgmtSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
