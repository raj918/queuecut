import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { CheckCircle2, Clock, MapPin, Sparkles, User as UserIcon } from 'lucide-react-native';
import { Booking } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme';
import { PrimaryButton, SecondaryButton } from '../../components/PrimaryButton';

export const BookingConfirmationScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { booking }: { booking: Booking } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.header}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={48} color={COLORS.success} />
          </View>
          <Text style={styles.title}>Token Booked!</Text>
          <Text style={styles.subtitle}>Your position in queue is secured</Text>
        </View>

        {/* Big Token Ticket Card */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketLabel}>YOUR QUEUE TOKEN</Text>
            <Text style={styles.tokenNumber}>{booking.tokenNumber}</Text>
            <Text style={styles.bookingRef}>Ref: {booking.bookingNumber}</Text>
          </View>

          <View style={styles.dashedDivider} />

          {/* Details */}
          <View style={styles.ticketBody}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Salon</Text>
              <Text style={styles.detailValue}>{booking.salon?.name || 'Salon'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Services</Text>
              <Text style={styles.detailValue}>
                {booking.bookingServices?.map((s) => s.serviceNameSnapshot).join(', ') || 'Selected Services'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stylist</Text>
              <Text style={styles.detailValue}>
                {booking.staff?.name || 'Any Available Barber'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estimated Service Duration</Text>
              <Text style={styles.detailValue}>{booking.totalDurationMinutes} mins</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Amount (Pay at Salon)</Text>
              <Text style={[styles.detailValue, styles.totalHighlight]}>
                ₹{booking.totalPrice}
              </Text>
            </View>
          </View>

          {/* Check-in Instructions */}
          <View style={styles.instructionsBox}>
            <Clock size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.instructionText}>
              Please arrive ~10 minutes before your turn. You can wait anywhere nearby until your phone buzzes!
            </Text>
          </View>
        </View>

        {/* CTAs */}
        <View style={styles.actionsContainer}>
          <PrimaryButton
            title="Track Live Queue"
            onPress={() => navigation.replace('LiveQueue', { bookingId: booking.id })}
            style={{ width: '100%', marginBottom: SPACING.md }}
          />
          <SecondaryButton
            title="Back to Home"
            onPress={() => navigation.navigate('CustomerHome')}
            style={{ width: '100%' }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ticketCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.lg,
    ...SHADOWS.card,
  },
  ticketHeader: {
    alignItems: 'center',
    paddingBottom: SPACING.md,
  },
  ticketLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textSecondary,
  },
  tokenNumber: {
    fontSize: 44,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
    marginVertical: 4,
  },
  bookingRef: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginVertical: SPACING.md,
  },
  ticketBody: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    flex: 1,
  },
  detailValue: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  totalHighlight: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryMuted,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  instructionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 16,
  },
  actionsContainer: {
    width: '100%',
    marginTop: SPACING.sm,
  },
});
