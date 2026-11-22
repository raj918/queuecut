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
  Linking,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Clock,
  Phone,
  Navigation,
  Wifi,
  WifiOff,
  User as UserIcon,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react-native';
import { Booking, BookingStatus, QueuePosition } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmationSheet } from '../../components/ConfirmationSheet';
import { RealtimeService } from '../../services/realtime';
import { api } from '../../services/api';

const STATUS_STEPS: BookingStatus[] = ['CONFIRMED', 'WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED'];

export const LiveQueueScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { bookingId } = route.params;

  const [queueData, setQueueData] = useState<QueuePosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeState, setRealtimeState] = useState<'CONNECTED' | 'RECONNECTING'>('CONNECTED');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchQueueData = useCallback(async () => {
    try {
      const res: any = await api.get(`/bookings/${bookingId}/queue-position`);
      if (res.success && res.data) {
        setQueueData(res.data);
      }
    } catch (err: any) {
      console.warn('Queue position fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchQueueData();

    // Subscribe to Supabase Realtime channel for this booking
    const unsubscribe = RealtimeService.subscribeToBooking(
      bookingId,
      (payload) => {
        // Reactive update: update status in place
        fetchQueueData();
      },
      (connStatus) => {
        if (connStatus === 'SUBSCRIBED') {
          setRealtimeState('CONNECTED');
        } else {
          setRealtimeState('RECONNECTING');
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [bookingId, fetchQueueData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchQueueData();
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      await api.post(`/bookings/${bookingId}/cancel`, {
        reason: 'Cancelled by customer from queue screen',
      });
      setCancelModalVisible(false);
      fetchQueueData();
      Alert.alert('Booking Cancelled', 'Your token has been removed from the queue.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const openDirections = () => {
    if (!queueData?.booking.salon) return;
    const { latitude, longitude, name } = queueData.booking.salon;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
    Linking.openURL(url || '');
  };

  const callSalon = () => {
    if (!queueData?.booking.salon?.phone) return;
    Linking.openURL(`tel:${queueData.booking.salon.phone}`);
  };

  const booking = queueData?.booking;
  const currentStatus = queueData?.status || 'CONFIRMED';
  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Queue Tracker</Text>

        {/* Realtime Connection Status Pill */}
        <View style={styles.connectionBadge}>
          {realtimeState === 'CONNECTED' ? (
            <>
              <View style={styles.onlineDot} />
              <Text style={styles.connectionText}>Live</Text>
            </>
          ) : (
            <>
              <View style={styles.offlineDot} />
              <Text style={styles.connectionText}>Syncing</Text>
            </>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Salon Paused Warning */}
        {queueData?.isPaused && (
          <View style={styles.warningBanner}>
            <AlertTriangle size={18} color="#B45309" style={{ marginRight: 8 }} />
            <Text style={styles.warningText}>
              Queue is temporarily paused by salon: {queueData.pauseReason || 'Staff lunch break'}.
              Existing tokens remain safely queued.
            </Text>
          </View>
        )}

        {/* Hero Token Card */}
        <View style={styles.heroCard}>
          <Text style={styles.tokenLabel}>YOUR TOKEN NUMBER</Text>
          <Text style={styles.tokenNumber}>{booking?.tokenNumber || '---'}</Text>
          <StatusBadge status={currentStatus} size="medium" />

          {/* Dynamic Queue Message */}
          <View style={styles.statusMessageBox}>
            <Text style={styles.statusMessage}>{queueData?.message}</Text>
          </View>

          {/* Key Queue Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Customers Ahead</Text>
              <Text style={styles.metricValue}>{queueData?.customersAhead ?? 0}</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Est. Waiting Time</Text>
              <Text style={[styles.metricValue, { color: COLORS.primary }]}>
                ~{queueData?.estimatedWaitMinutes ?? 0} mins
              </Text>
            </View>
          </View>
        </View>

        {/* Status Stepper Progression */}
        <View style={styles.stepperCard}>
          <Text style={styles.stepperTitle}>Turn Progress</Text>
          <View style={styles.stepperRow}>
            {STATUS_STEPS.map((step, idx) => {
              const isPastOrCurrent = currentIndex >= idx;
              const isCurrent = currentIndex === idx;
              return (
                <View key={step} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      isPastOrCurrent && styles.activeStepCircle,
                      isCurrent && styles.currentStepCircle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepIndexText,
                        isPastOrCurrent && { color: '#FFFFFF' },
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepLabel, isCurrent && styles.currentStepLabel]}>
                    {step === 'CONFIRMED'
                      ? 'Booked'
                      : step === 'WAITING'
                      ? 'In Queue'
                      : step === 'CALLED'
                      ? 'Called'
                      : step === 'IN_SERVICE'
                      ? 'In Chair'
                      : 'Done'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Booking Details Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeaderTitle}>Service & Salon Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Salon</Text>
            <Text style={styles.infoValue}>{booking?.salon?.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{booking?.salon?.address}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Stylist</Text>
            <Text style={styles.infoValue}>{booking?.staff?.name || 'Any Available Barber'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Services</Text>
            <Text style={styles.infoValue}>
              {booking?.bookingServices?.map((s) => s.serviceNameSnapshot).join(', ') || 'Service'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pay at Counter</Text>
            <Text style={[styles.infoValue, { color: COLORS.primary, fontWeight: '800' }]}>
              ₹{booking?.totalPrice}
            </Text>
          </View>
        </View>

        {/* Action Row: Directions & Call */}
        <View style={styles.contactRow}>
          <TouchableOpacity onPress={openDirections} style={styles.actionBtn}>
            <Navigation size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Get Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={callSalon} style={styles.actionBtn}>
            <Phone size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Call Salon</Text>
          </TouchableOpacity>
        </View>

        {/* Cancellation Option (Only available before service begins) */}
        {!['IN_SERVICE', 'COMPLETED', 'CANCELLED', 'SKIPPED', 'NO_SHOW'].includes(currentStatus) && (
          <TouchableOpacity
            onPress={() => setCancelModalVisible(true)}
            style={styles.cancelLink}
          >
            <Text style={styles.cancelLinkText}>Cancel this Token</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Confirmation Sheet */}
      <ConfirmationSheet
        visible={cancelModalVisible}
        title="Cancel Token Booking?"
        message="Are you sure you want to release your spot in line? Cancelled tokens cannot be restored."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Token"
        isDestructive
        onConfirm={handleCancelBooking}
        onCancel={() => setCancelModalVisible(false)}
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
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.warning,
    marginRight: 4,
  },
  connectionText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  warningText: {
    ...TYPOGRAPHY.caption,
    color: '#92400E',
    flex: 1,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  tokenLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  tokenNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  statusMessageBox: {
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.md,
    width: '100%',
  },
  statusMessage: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  metricDivider: {
    width: 1,
    backgroundColor: COLORS.borderLight,
  },
  stepperCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    marginBottom: SPACING.md,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeStepCircle: {
    backgroundColor: COLORS.primary,
  },
  currentStepCircle: {
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  stepIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  stepLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  currentStepLabel: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  cardHeaderTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    marginBottom: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  infoValue: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.md,
  },
  contactRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  cancelLink: {
    alignSelf: 'center',
    padding: SPACING.sm,
  },
  cancelLinkText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: '600',
  },
});
