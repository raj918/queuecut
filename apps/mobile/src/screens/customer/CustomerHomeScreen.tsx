import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { MapPin, SlidersHorizontal, Map as MapIcon, Scissors, AlertCircle } from 'lucide-react-native';
import { Salon } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { SearchBar } from '../../components/SearchBar';
import { SalonCard } from '../../components/SalonCard';
import { EmptyState } from '../../components/States';
import { SalonCardSkeleton } from '../../components/LoadingSkeleton';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { api } from '../../services/api';

const CATEGORIES = [
  'All',
  'Haircut',
  'Beard',
  'Hair & Beard',
  'Hair Styling',
  'Facial',
  'Grooming',
];

const RADIUS_OPTIONS = [
  { label: '500 m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '3 km', value: 3000 },
  { label: '5 km', value: 5000 },
];

export const CustomerHomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const { latitude, longitude, localityName, searchRadiusMeters, setRadius } = useLocationStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [salons, setSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSalons = useCallback(async () => {
    try {
      setError(null);
      const params: any = {
        latitude,
        longitude,
        radiusMeters: searchRadiusMeters,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      const res: any = await api.get('/salons/nearby', { params });
      if (res.success && res.data) {
        setSalons(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch salons nearby');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [latitude, longitude, searchRadiusMeters, search, selectedCategory]);

  useEffect(() => {
    setIsLoading(true);
    fetchSalons();
  }, [fetchSalons]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchSalons();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Top Location Bar */}
      <View style={styles.topBar}>
        <View style={styles.locationContainer}>
          <MapPin size={16} color={COLORS.primary} />
          <View style={{ marginLeft: 6 }}>
            <Text style={styles.locationCaption}>Current Location</Text>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {localityName}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('DiscoveryMap')}
          style={styles.mapIconButton}
          accessibilityLabel="Open Interactive Map"
        >
          <MapIcon size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        keyboardShouldPersistTaps="handled"
      >
        {/* Welcome Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Hello, {user?.name?.split(' ')[0] || 'Friend'} 👋</Text>
          <Text style={styles.greetingSubtitle}>Book your turn. Skip the wait.</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search salons near you..."
            onClear={() => setSearch('')}
          />
        </View>

        {/* Radius Filter Selector */}
        <View style={styles.radiusSection}>
          <Text style={styles.filterHeaderTitle}>Search Radius:</Text>
          <View style={styles.radiusPillsRow}>
            {RADIUS_OPTIONS.map((opt) => {
              const isSelected = searchRadiusMeters === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setRadius(opt.value)}
                  style={[styles.radiusPill, isSelected && styles.selectedRadiusPill]}
                >
                  <Text style={[styles.radiusPillText, isSelected && styles.selectedRadiusPillText]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Categories Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryPill, isSelected && styles.selectedCategoryPill]}
              >
                <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Salons Header Count */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>
            Nearby Salons ({salons.length})
          </Text>
          <Text style={styles.distanceSortedNotice}>Sorted by distance</Text>
        </View>

        {/* Content State: Loading, Error, Empty, or List */}
        {isLoading ? (
          <View>
            <SalonCardSkeleton />
            <SalonCardSkeleton />
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={24} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchSalons} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : salons.length === 0 ? (
          <EmptyState
            title={`No salons within ${searchRadiusMeters >= 1000 ? `${searchRadiusMeters / 1000} km` : `${searchRadiusMeters} m`}`}
            description="We couldn't find active salons in this radius. Try expanding your search distance."
            actionLabel="Search within 3 km"
            onAction={() => setRadius(3000)}
          />
        ) : (
          salons.map((salon) => (
            <SalonCard
              key={salon.id}
              salon={salon}
              onPress={() => navigation.navigate('SalonDetails', { salonId: salon.id })}
              onBookPress={() => navigation.navigate('SalonDetails', { salonId: salon.id })}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationCaption: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  locationTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  mapIconButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: 60,
  },
  greetingSection: {
    marginBottom: SPACING.md,
  },
  greetingTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
  },
  greetingSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchSection: {
    marginBottom: SPACING.md,
  },
  radiusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  filterHeaderTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    marginRight: SPACING.sm,
    color: COLORS.textSecondary,
  },
  radiusPillsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  radiusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedRadiusPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectedRadiusPillText: {
    color: '#FFFFFF',
  },
  categoriesScroll: {
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  categoryPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedCategoryPill: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectedCategoryText: {
    color: COLORS.primaryDark,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  sectionHeaderTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  distanceSortedNotice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  errorBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  retryBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
