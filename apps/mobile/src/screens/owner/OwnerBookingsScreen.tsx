import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Booking, BookingSource } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { QueueTokenCard } from '../../components/QueueTokenCard';
import { EmptyState } from '../../components/States';
import { api } from '../../services/api';

type SourceFilter = 'ALL' | 'ONLINE' | 'WALK_IN';

export const OwnerBookingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const params: any = {};
      if (sourceFilter !== 'ALL') {
        params.source = sourceFilter;
      }

      const res: any = await api.get('/owner/bookings', { params });
      if (res.success && res.data) {
        setBookings(res.data);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sourceFilter]);

  useEffect(() => {
    setIsLoading(true);
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchBookings();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Salon Booking History</Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['ALL', 'ONLINE', 'WALK_IN'] as SourceFilter[]).map((src) => {
          const isSelected = sourceFilter === src;
          return (
            <TouchableOpacity
              key={src}
              onPress={() => setSourceFilter(src)}
              style={[styles.filterChip, isSelected && styles.selectedFilterChip]}
            >
              <Text style={[styles.filterText, isSelected && styles.selectedFilterText]}>
                {src === 'ALL' ? 'All Bookings' : src === 'ONLINE' ? 'Online App (5% Comm.)' : 'Walk-in (0% Comm.)'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {bookings.length === 0 && !isLoading ? (
          <EmptyState
            title="No Bookings Found"
            description="Bookings matching your selected source filter will appear here."
          />
        ) : (
          bookings.map((booking) => (
            <QueueTokenCard key={booking.id} booking={booking} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedFilterChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectedFilterText: {
    color: COLORS.primaryDark,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
});
