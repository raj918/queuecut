import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, StatusBar } from 'react-native';
import { Scissors, Clock, MapPin, ShieldCheck } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { PrimaryButton, SecondaryButton } from '../../components/PrimaryButton';

export const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Scissors size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.brandTitle}>QueueCut</Text>
          <Text style={styles.tagline}>Book your turn. Skip the wait.</Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.cardContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MapPin size={20} color={COLORS.primary} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Nearby Salon Discovery</Text>
              <Text style={styles.featureDesc}>
                Find verified salons within 500m of your exact location in Kanpur.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Clock size={20} color={COLORS.primary} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Live Digital Queue</Text>
              <Text style={styles.featureDesc}>
                Get an atomic token (Q-001) and track your wait time in real-time.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <ShieldCheck size={20} color={COLORS.primary} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Arrive Just in Time</Text>
              <Text style={styles.featureDesc}>
                Receive a push alert when your barber calls your turn. Zero waiting bench hassle.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Get Started"
            onPress={() => navigation.navigate('LocationPermission')}
            style={styles.primaryBtn}
          />
          <SecondaryButton
            title="Log In to Existing Account"
            onPress={() => navigation.navigate('Login')}
            style={styles.secondaryBtn}
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
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xxxl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  brandTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
  },
  tagline: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  buttonContainer: {
    gap: SPACING.md,
  },
  primaryBtn: {
    width: '100%',
  },
  secondaryBtn: {
    width: '100%',
  },
});
