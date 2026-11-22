import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, User as UserIcon } from 'lucide-react-native';
import { Booking } from '../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';
import { StatusBadge } from './StatusBadge';

interface QueueTokenCardProps {
  booking: Booking;
  customersAhead?: number;
  estimatedWaitMinutes?: number;
  onPress?: () => void;
  showActions?: boolean;
  onCall?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
}

export const QueueTokenCard: React.FC<QueueTokenCardProps> = ({
  booking,
  customersAhead,
  estimatedWaitMinutes,
  onPress,
  showActions = false,
  onCall,
  onStart,
  onComplete,
}) => {
  const customerDisplayName =
    booking.customer?.name ||
    booking.walkInCustomerName ||
    'Customer';

  const servicesList =
    booking.bookingServices?.map((s) => s.serviceNameSnapshot).join(', ') || 'Styling Service';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenNumber}>{booking.tokenNumber}</Text>
          {booking.bookingSource === 'WALK_IN' && (
            <View style={styles.walkInPill}>
              <Text style={styles.walkInText}>Walk-in</Text>
            </View>
          )}
        </View>

        <StatusBadge status={booking.status} size="small" />
      </View>

      <View style={styles.divider} />

      <View style={styles.middleRow}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customerDisplayName}</Text>
          <Text style={styles.servicesText} numberOfLines={1}>
            {servicesList}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.totalPrice}>₹{booking.totalPrice}</Text>
        </View>
      </View>

      {/* Meta indicators */}
      <View style={styles.metaRow}>
        {booking.staff && (
          <View style={styles.metaItem}>
            <UserIcon size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.metaText}>{booking.staff.name}</Text>
          </View>
        )}

        {customersAhead !== undefined && (
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>
              {customersAhead === 0 ? 'Next in line' : `${customersAhead} ahead`}
            </Text>
          </View>
        )}

        {estimatedWaitMinutes !== undefined && estimatedWaitMinutes > 0 && (
          <View style={styles.metaItem}>
            <Clock size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.metaText, { color: COLORS.primary }]}>
              ~{estimatedWaitMinutes} mins
            </Text>
          </View>
        )}
      </View>

      {/* Owner Quick Actions */}
      {showActions && (
        <View style={styles.actionsRow}>
          {booking.status === 'WAITING' || booking.status === 'CHECKED_IN' ? (
            <TouchableOpacity onPress={onCall} style={[styles.actionBtn, styles.callBtn]}>
              <Text style={styles.actionBtnText}>Call Turn</Text>
            </TouchableOpacity>
          ) : null}

          {booking.status === 'CALLED' ? (
            <TouchableOpacity onPress={onStart} style={[styles.actionBtn, styles.startBtn]}>
              <Text style={styles.actionBtnText}>Start Service</Text>
            </TouchableOpacity>
          ) : null}

          {booking.status === 'IN_SERVICE' ? (
            <TouchableOpacity onPress={onComplete} style={[styles.actionBtn, styles.completeBtn]}>
              <Text style={styles.actionBtnText}>Complete & Bill</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  walkInPill: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginLeft: SPACING.sm,
  },
  walkInText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  customerInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  customerName: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  servicesText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  totalPrice: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...TYPOGRAPHY.caption,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    backgroundColor: '#0284C7',
  },
  startBtn: {
    backgroundColor: COLORS.primary,
  },
  completeBtn: {
    backgroundColor: COLORS.success,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
