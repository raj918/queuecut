import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Clock } from 'lucide-react-native';
import { Service } from '../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme';
import { PriceLabel } from './Labels';

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSelected,
  onToggle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      disabled={disabled}
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        disabled && styles.disabledCard,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
    >
      <View style={styles.leftContainer}>
        {/* Checkbox circle */}
        <View style={[styles.checkbox, isSelected && styles.selectedCheckbox]}>
          {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, isSelected && styles.selectedTitle]}>
            {service.name}
          </Text>
          {service.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {service.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Clock size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.durationText}>{service.durationMinutes} mins</Text>
          </View>
        </View>
      </View>

      <View style={styles.priceContainer}>
        <PriceLabel price={service.price} size="medium" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
  },
  disabledCard: {
    opacity: 0.5,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: SPACING.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  selectedCheckbox: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  info: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedTitle: {
    color: COLORS.primaryDark,
  },
  description: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  durationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
});
