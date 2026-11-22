import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BookingStatus } from '../types';
import { COLORS, SPACING, RADIUS } from '../theme';

interface StatusBadgeProps {
  status: BookingStatus | string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  const getStatusConfig = (st: string) => {
    switch (st) {
      case 'CONFIRMED':
        return { label: 'Confirmed', bg: COLORS.infoLight, text: COLORS.info };
      case 'CHECKED_IN':
        return { label: 'Checked In', bg: COLORS.primaryLight, text: COLORS.primaryDark };
      case 'WAITING':
        return { label: 'In Queue', bg: COLORS.warningLight, text: COLORS.warning };
      case 'CALLED':
        return { label: 'Called', bg: '#E0F2FE', text: '#0369A1' };
      case 'IN_SERVICE':
        return { label: 'In Service', bg: COLORS.primaryLight, text: COLORS.primary };
      case 'COMPLETED':
        return { label: 'Completed', bg: COLORS.successLight, text: COLORS.success };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: COLORS.errorLight, text: COLORS.error };
      case 'SKIPPED':
        return { label: 'Skipped', bg: '#F3F4F6', text: '#6B7280' };
      case 'NO_SHOW':
        return { label: 'No Show', bg: COLORS.errorLight, text: COLORS.error };
      default:
        return { label: st, bg: COLORS.surfaceSubtle, text: COLORS.textSecondary };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        size === 'medium' && styles.badgeMedium,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text
        style={[
          styles.text,
          { color: config.text },
          size === 'medium' && styles.textMedium,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  badgeMedium: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  textMedium: {
    fontSize: 13,
  },
});
