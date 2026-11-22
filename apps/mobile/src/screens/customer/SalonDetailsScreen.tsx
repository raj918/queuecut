import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Users,
  Navigation,
  CheckCircle,
  Phone,
} from 'lucide-react-native';
import { Salon, Service, Staff } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme';
import { ServiceCard } from '../../components/ServiceCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Avatar } from '../../components/Avatar';
import { PriceLabel, DistanceLabel } from '../../components/Labels';
import { useLocationStore } from '../../store/locationStore';
import { api } from '../../services/api';

export const SalonDetailsScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { salonId } = route.params;
  const { latitude, longitude } = useLocationStore();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetchSalonDetails();
  }, [salonId]);

  const fetchSalonDetails = async () => {
    try {
      const res: any = await api.get(`/salons/${salonId}`, {
        params: { lat: latitude, lon: longitude },
      });
      if (res.success && res.data) {
        setSalon(res.data);
        // Pre-select first service by default
        if (res.data.services && res.data.services.length > 0) {
          setSelectedServiceIds([res.data.services[0].id]);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load salon details');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      if (selectedServiceIds.length === 1) {
        Alert.alert('Select at least one', 'You must have at least one service selected.');
        return;
      }
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  // Calculate selected total price and duration
  const selectedServices = salon?.services?.filter((s) => selectedServiceIds.includes(s.id)) || [];
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  const handleBookToken = async () => {
    if (!salon) return;

    if (!salon.isOpen || salon.isPaused) {
      Alert.alert(
        'Salon Unavailable',
        salon.pauseReason || 'This salon is currently closed or queue bookings are paused.'
      );
      return;
    }

    if (selectedServiceIds.length === 0) {
      Alert.alert('No Services', 'Please choose at least one styling service.');
      return;
    }

    setIsBooking(true);
    try {
      const idempotencyKey = `idemp_${salon.id}_${Date.now()}`;
      const res: any = await api.post('/bookings', {
        salonId: salon.id,
        serviceIds: selectedServiceIds,
        staffId: selectedStaffId,
        idempotencyKey,
      });

      if (res.success && res.data) {
        navigation.replace('BookingConfirmation', { booking: res.data });
      }
    } catch (error: any) {
      Alert.alert('Booking Error', error.message || 'Could not reserve token. Please retry.');
    } finally {
      setIsBooking(false);
    }
  };

  const openDirections = () => {
    if (!salon) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${salon.latitude},${salon.longitude}`,
      android: `geo:0,0?q=${salon.latitude},${salon.longitude}(${encodeURIComponent(salon.name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${salon.latitude},${salon.longitude}`,
    });
    Linking.openURL(url || '');
  };

  if (isLoading || !salon) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover Image Header */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                salon.coverImage ||
                'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80',
            }}
            style={styles.coverImage}
          />
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Back"
          >
            <ArrowLeft size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Salon Core Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.salonName}>{salon.name}</Text>
            <View style={styles.ratingBadge}>
              <Star size={14} color="#EAB308" fill="#EAB308" />
              <Text style={styles.ratingText}>
                {salon.averageRating.toFixed(1)} ({salon.reviewCount})
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.addressText}>{salon.address}</Text>
          </View>

          {/* Quick Metrics Chips */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Clock size={16} color={COLORS.primary} />
              <Text style={styles.statNumber}>~{salon.estimatedWaitMinutes || 15}m</Text>
              <Text style={styles.statLabel}>Est. Wait</Text>
            </View>

            <View style={styles.statCard}>
              <Users size={16} color={COLORS.textSecondary} />
              <Text style={styles.statNumber}>{salon.currentQueueCount || 0}</Text>
              <Text style={styles.statLabel}>In Queue</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.openPillText}>{salon.isOpen ? 'OPEN' : 'CLOSED'}</Text>
              <Text style={styles.statNumber}>{salon.openingTime} - {salon.closingTime}</Text>
              <Text style={styles.statLabel}>Hours</Text>
            </View>
          </View>

          {/* Directions Button */}
          <TouchableOpacity onPress={openDirections} style={styles.directionsBtn}>
            <Navigation size={15} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.directionsBtnText}>Get Directions to Salon</Text>
          </TouchableOpacity>

          {/* Service Multi-Select Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Services</Text>
            <Text style={styles.sectionSubtitle}>
              {selectedServiceIds.length} selected ({totalDuration} mins)
            </Text>
          </View>

          {salon.services?.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={selectedServiceIds.includes(service.id)}
              onToggle={() => toggleService(service.id)}
            />
          ))}

          {/* Stylist Preference */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferred Stylist</Text>
            <Text style={styles.sectionSubtitle}>Choose who cuts your hair</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffScroll}>
            {/* Any Available Option */}
            <TouchableOpacity
              onPress={() => setSelectedStaffId(null)}
              style={[
                styles.staffChip,
                selectedStaffId === null && styles.selectedStaffChip,
              ]}
            >
              <View style={styles.anyStaffIcon}>
                <Users size={16} color={selectedStaffId === null ? '#fff' : COLORS.primary} />
              </View>
              <Text style={[styles.staffName, selectedStaffId === null && { color: '#fff' }]}>
                Any Available
              </Text>
              <Text style={[styles.staffRole, selectedStaffId === null && { color: '#E2E8F0' }]}>
                Fastest Turn
              </Text>
            </TouchableOpacity>

            {salon.staff?.map((st) => {
              const isSelected = selectedStaffId === st.id;
              return (
                <TouchableOpacity
                  key={st.id}
                  onPress={() => setSelectedStaffId(st.id)}
                  style={[styles.staffChip, isSelected && styles.selectedStaffChip]}
                >
                  <Avatar url={st.avatarUrl} name={st.name} size={36} />
                  <Text style={[styles.staffName, isSelected && { color: '#fff' }]} numberOfLines={1}>
                    {st.name}
                  </Text>
                  <Text style={[styles.staffRole, isSelected && { color: '#E2E8F0' }]} numberOfLines={1}>
                    {st.role}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Floating Bottom Booking Bar */}
      <View style={styles.bookingBar}>
        <View style={styles.bookingPriceSummary}>
          <Text style={styles.totalLabel}>Total Price ({totalDuration} min)</Text>
          <PriceLabel price={totalPrice} size="large" />
        </View>

        <PrimaryButton
          title={salon.isOpen ? 'Confirm & Book Token' : 'Salon Closed'}
          onPress={handleBookToken}
          isLoading={isBooking}
          disabled={!salon.isOpen || salon.isPaused || selectedServiceIds.length === 0}
          style={styles.bookCTA}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  imageContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginTop: -20,
    padding: SPACING.xl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  salonName: {
    ...TYPOGRAPHY.h1,
    fontSize: 22,
    flex: 1,
    marginRight: SPACING.md,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854D0E',
    marginLeft: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  addressText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '700',
    marginTop: 2,
    fontSize: 14,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  openPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    marginBottom: SPACING.xl,
  },
  directionsBtnText: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  staffScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  staffChip: {
    width: 105,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  selectedStaffChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  anyStaffIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffName: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  staffRole: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bookingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.float,
  },
  bookingPriceSummary: {
    flex: 1,
  },
  totalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  bookCTA: {
    minWidth: 180,
  },
});
