import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, Clock, Users } from 'lucide-react-native';
import { Salon } from '../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';
import { PriceLabel, DistanceLabel } from './Labels';

interface SalonCardProps {
  salon: Salon;
  onPress: () => void;
  onBookPress?: () => void;
}

export const SalonCard: React.FC<SalonCardProps> = ({
  salon,
  onPress,
  onBookPress,
}) => {
  const isAvailableNow = salon.isOpen && !salon.isPaused;
  const waitTime = salon.estimatedWaitMinutes ?? 15;
  const availableBarbers = salon.availableBarbersCount ?? 2;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
    >
      {/* Cover Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              salon.coverImage ||
              'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80',
          }}
          style={styles.coverImage}
        />
        {/* Status Pill */}
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isAvailableNow ? 'rgba(22, 163, 74, 0.9)' : 'rgba(220, 38, 38, 0.9)' },
          ]}
        >
          <Text style={styles.statusText}>{isAvailableNow ? 'Open Now' : 'Closed'}</Text>
        </View>

        {/* Distance Pill */}
        {salon.distanceMeters !== undefined && (
          <View style={styles.distancePill}>
            <DistanceLabel
              distanceMeters={salon.distanceMeters}
              distanceFormatted={salon.distanceFormatted}
            />
          </View>
        )}
      </View>

      {/* Info Body */}
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {salon.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Star size={13} color="#EAB308" fill="#EAB308" />
            <Text style={styles.ratingText}>
              {salon.averageRating.toFixed(1)}{' '}
              <Text style={styles.reviewCountText}>({salon.reviewCount})</Text>
            </Text>
          </View>
        </View>

        <Text style={styles.locality} numberOfLines={1}>
          {salon.locality}, {salon.city}
        </Text>

        {/* Live Queue & Staff Status Chips */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Clock size={13} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.metaText}>
              ~{waitTime} mins wait
            </Text>
          </View>

          <View style={styles.metaChip}>
            <Users size={13} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.metaText}>
              {availableBarbers} {availableBarbers === 1 ? 'barber' : 'barbers'} ready
            </Text>
          </View>
        </View>

        {/* Bottom Action Row */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.startingAtText}>Starting from</Text>
            <PriceLabel price={salon.startingPrice || 120} size="small" />
          </View>

          <TouchableOpacity
            style={[styles.bookButton, !isAvailableNow && styles.disabledBookButton]}
            disabled={!isAvailableNow}
            onPress={onBookPress || onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.bookButtonText}>Book Token</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  imageContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
    backgroundColor: COLORS.surfaceSubtle,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  statusPill: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  distancePill: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  body: {
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: {
    ...TYPOGRAPHY.h3,
    flex: 1,
    marginRight: SPACING.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854D0E',
    marginLeft: 3,
  },
  reviewCountText: {
    fontWeight: '400',
    color: '#A16207',
    fontSize: 11,
  },
  locality: {
    ...TYPOGRAPHY.bodySmall,
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  startingAtText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  disabledBookButton: {
    backgroundColor: '#94A3B8',
  },
  bookButtonText: {
    color: COLORS.textInverse,
    fontWeight: '600',
    fontSize: 13,
  },
});
