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
import { Booking } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { QueueTokenCard } from '../../components/QueueTokenCard';
import { EmptyState } from '../../components/States';
import { api } from '../../services/api';

type TabType = 'active' | 'upcoming' | 'completed' | 'cancelled';

export const CustomerBookingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const res: any = await api.get('/bookings/my', {
        params: { tab: activeTab },
      });
      if (res.success && res.data) {
        setBookings(res.data);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setIsLoading(true);
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchBookings();
  };

  const getEmptyDetails = () => {
    switch (activeTab) {
      case 'active':
        return {
          title: 'No Active Tokens',
          desc: 'You are currently not queued in any salon. Find a nearby salon to skip the wait!',
        };
      case 'upcoming':
        return {
          title: 'No Upcoming Bookings',
          desc: 'You have no future bookings scheduled.',
        };
      case 'completed':
        return {
          title: 'No Completed Bookings',
          desc: 'Your completed haircuts and salon visits will appear here.',
        };
      case 'cancelled':
        return {
          title: 'No Cancelled Bookings',
          desc: 'No cancelled or no-show bookings.',
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['active', 'upcoming', 'completed', 'cancelled'] as TabType[]).map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, isSelected && styles.activeTab]}
            >
              <Text style={[styles.tabText, isSelected && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
            title={getEmptyDetails().title}
            description={getEmptyDetails().desc}
            actionLabel="Discover Salons"
            onAction={() => navigation.navigate('CustomerHome')}
          />
        ) : (
          bookings.map((booking) => (
            <QueueTokenCard
              key={booking.id}
              booking={booking}
              onPress={() => {
                if (['CONFIRMED', 'WAITING', 'CALLED', 'IN_SERVICE'].includes(booking.status)) {
                  navigation.navigate('LiveQueue', { bookingId: booking.id });
                }
              }}
            />
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
});
