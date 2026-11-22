import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Navigation,
  Layers,
  MapPin,
  List,
  SlidersHorizontal,
} from 'lucide-react-native';
import { Salon } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme';
import { SalonCard } from '../../components/SalonCard';
import { useLocationStore } from '../../store/locationStore';
import { api } from '../../services/api';

// MapLibre dynamic import with graceful fallback
let MapLibreGL: any = null;
try {
  MapLibreGL = require('@maplibre/maplibre-react-native').default;
} catch (e) {
  // Graceful fallback for non-native environments
}

const OSM_BRIGHT_STYLE = 'https://tiles.openfreemap.org/styles/bright';

export const DiscoveryMapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { latitude, longitude, searchRadiusMeters, setRadius } = useLocationStore();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isLoading, setIsLoading] = useState(true);

  const cameraRef = useRef<any>(null);

  useEffect(() => {
    fetchNearbySalons();
  }, [latitude, longitude, searchRadiusMeters]);

  const fetchNearbySalons = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/salons/nearby', {
        params: {
          latitude,
          longitude,
          radiusMeters: searchRadiusMeters,
        },
      });
      if (res.success && res.data) {
        setSalons(res.data);
        if (res.data.length > 0) {
          setSelectedSalon(res.data[0]);
        }
      }
    } catch (err) {
      console.warn('Map salon fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const recenter = () => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 14.5,
        animationDuration: 800,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Floating Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Explore Nearby</Text>
          <Text style={styles.headerSubtitle}>
            {salons.length} {salons.length === 1 ? 'salon' : 'salons'} in radius
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
          style={styles.headerButton}
          accessibilityLabel="Toggle View"
        >
          {viewMode === 'map' ? (
            <List size={20} color={COLORS.primary} />
          ) : (
            <Layers size={20} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Main View Area */}
      {viewMode === 'list' ? (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {salons.map((s) => (
            <SalonCard
              key={s.id}
              salon={s}
              onPress={() => navigation.navigate('SalonDetails', { salonId: s.id })}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.mapContainer}>
          {MapLibreGL ? (
            <MapLibreGL.MapView
              style={styles.mapView}
              mapStyle={OSM_BRIGHT_STYLE}
              logoEnabled={false}
              attributionEnabled={false}
            >
              <MapLibreGL.Camera
                ref={cameraRef}
                centerCoordinate={[longitude, latitude]}
                zoomLevel={14.2}
              />

              {/* User Location Marker */}
              <MapLibreGL.PointAnnotation id="user-location" coordinate={[longitude, latitude]}>
                <View style={styles.userMarkerOuter}>
                  <View style={styles.userMarkerInner} />
                </View>
              </MapLibreGL.PointAnnotation>

              {/* Salon Markers */}
              {salons.map((salon) => {
                const isSelected = selectedSalon?.id === salon.id;
                return (
                  <MapLibreGL.PointAnnotation
                    key={salon.id}
                    id={`salon-${salon.id}`}
                    coordinate={[salon.longitude, salon.latitude]}
                    onSelected={() => setSelectedSalon(salon)}
                  >
                    <View style={[styles.salonMarker, isSelected && styles.selectedSalonMarker]}>
                      <MapPin
                        size={18}
                        color={isSelected ? '#FFFFFF' : COLORS.primary}
                        fill={isSelected ? '#FFFFFF' : 'transparent'}
                      />
                    </View>
                  </MapLibreGL.PointAnnotation>
                );
              })}
            </MapLibreGL.MapView>
          ) : (
            // Native Map fallback simulation container for preview
            <View style={styles.mapFallbackView}>
              <View style={styles.fallbackCenterPin}>
                <Navigation size={32} color={COLORS.primary} />
                <Text style={styles.fallbackPinText}>Your Location</Text>
              </View>

              <View style={styles.mockPinRow}>
                {salons.map((salon) => (
                  <TouchableOpacity
                    key={salon.id}
                    onPress={() => setSelectedSalon(salon)}
                    style={[
                      styles.mockSalonPin,
                      selectedSalon?.id === salon.id && styles.selectedMockPin,
                    ]}
                  >
                    <MapPin size={16} color={selectedSalon?.id === salon.id ? '#fff' : COLORS.primary} />
                    <Text
                      style={[
                        styles.mockSalonPinText,
                        selectedSalon?.id === salon.id && { color: '#fff' },
                      ]}
                      numberOfLines={1}
                    >
                      {salon.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Floating Controls: Radius & Recenter */}
          <View style={styles.floatingControls}>
            <TouchableOpacity onPress={recenter} style={styles.controlCircle} accessibilityLabel="Recenter">
              <Navigation size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Selected Salon Preview Bottom Sheet Card */}
          {selectedSalon && (
            <View style={styles.previewSheet}>
              <SalonCard
                salon={selectedSalon}
                onPress={() =>
                  navigation.navigate('SalonDetails', { salonId: selectedSalon.id })
                }
              />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: SPACING.lg,
    right: SPACING.lg,
    height: 52,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    zIndex: 10,
    ...SHADOWS.float,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSubtle,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapView: {
    flex: 1,
  },
  mapFallbackView: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  fallbackCenterPin: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  fallbackPinText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 4,
  },
  mockPinRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  mockSalonPin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    maxWidth: 160,
  },
  selectedMockPin: {
    backgroundColor: COLORS.primary,
  },
  mockSalonPinText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  userMarkerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 118, 110, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  salonMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.card,
  },
  selectedSalonMarker: {
    backgroundColor: COLORS.primary,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  floatingControls: {
    position: 'absolute',
    right: SPACING.lg,
    top: 90,
    gap: SPACING.sm,
  },
  controlCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.float,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewSheet: {
    position: 'absolute',
    bottom: 20,
    left: SPACING.lg,
    right: SPACING.lg,
  },
  listContainer: {
    paddingTop: 80,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
});
