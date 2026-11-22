import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { PrimaryButton, SecondaryButton } from '../../components/PrimaryButton';
import { useLocationStore } from '../../store/locationStore';

export const LocationPermissionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const { setPermission, setLocation } = useLocationStore();

  const handleGrantPermission = async () => {
    setIsRequesting(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'QueueCut Location Permission',
            message: 'QueueCut requires location access to find salons within 500m of you.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setPermission(true);
          // Anchor to Kanpur showcase coordinates
          setLocation(26.4729, 80.3458, 'Civil Lines, Kanpur');
        } else {
          setPermission(false);
        }
      } else {
        setPermission(true);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setIsRequesting(false);
      navigation.navigate('NotificationPermission');
    }
  };

  const handleManualLocation = () => {
    setPermission(false);
    setLocation(26.4729, 80.3458, 'Civil Lines, Kanpur');
    navigation.navigate('NotificationPermission');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.iconCircle}>
            <Navigation size={40} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Find Salons Near You</Text>
          <Text style={styles.description}>
            QueueCut uses your GPS location to search for available salons within 500 metres,
            calculate accurate walking distances, and track your spot in line.
          </Text>

          <View style={styles.highlightBox}>
            <MapPin size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.highlightText}>
              We never share your location with third parties or advertisers.
            </Text>
          </View>
        </View>

        <View style={styles.bottomActions}>
          <PrimaryButton
            title="Enable Location Access"
            onPress={handleGrantPermission}
            isLoading={isRequesting}
            style={{ width: '100%', marginBottom: SPACING.md }}
          />
          <SecondaryButton
            title="Enter Location Manually"
            onPress={handleManualLocation}
            style={{ width: '100%' }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
    paddingBottom: SPACING.xxl,
  },
  centerContent: {
    alignItems: 'center',
    marginTop: 80,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 320,
  },
  highlightText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  bottomActions: {
    width: '100%',
  },
});
