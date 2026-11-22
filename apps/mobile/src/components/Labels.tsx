import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';

interface PriceLabelProps {
  price: number;
  prefix?: string;
  size?: 'small' | 'medium' | 'large';
}

export const PriceLabel: React.FC<PriceLabelProps> = ({
  price,
  prefix = '₹',
  size = 'medium',
}) => {
  return (
    <Text
      style={[
        styles.price,
        size === 'small' && styles.smallPrice,
        size === 'large' && styles.largePrice,
      ]}
    >
      {prefix}
      {price.toLocaleString('en-IN')}
    </Text>
  );
};

interface DistanceLabelProps {
  distanceMeters?: number;
  distanceFormatted?: string;
  showIcon?: boolean;
}

export const DistanceLabel: React.FC<DistanceLabelProps> = ({
  distanceMeters,
  distanceFormatted,
  showIcon = true,
}) => {
  const formatted =
    distanceFormatted ||
    (distanceMeters !== undefined
      ? distanceMeters < 1000
        ? `${Math.round(distanceMeters)} m`
        : `${(distanceMeters / 1000).toFixed(1)} km`
      : '');

  if (!formatted) return null;

  return (
    <View style={styles.distanceContainer}>
      {showIcon && <MapPin size={12} color={COLORS.textSecondary} style={{ marginRight: 3 }} />}
      <Text style={styles.distanceText}>{formatted}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  price: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  smallPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  largePrice: {
    fontSize: 22,
    fontWeight: '700',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
