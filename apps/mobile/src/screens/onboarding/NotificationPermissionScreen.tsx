import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Bell, CheckCircle2 } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { PrimaryButton, SecondaryButton } from '../../components/PrimaryButton';
import { MobileNotificationService } from '../../services/notifications';

export const NotificationPermissionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      await MobileNotificationService.requestPermission();
      await MobileNotificationService.setupChannels();
    } catch (err) {
      console.warn(err);
    } finally {
      setIsRequesting(false);
      navigation.navigate('Register');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.iconCircle}>
            <Bell size={40} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Never Miss Your Turn</Text>
          <Text style={styles.description}>
            Wait comfortably at a coffee shop or in your car. QueueCut will alert you
            the moment your barber is ready for your turn.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <CheckCircle2 size={18} color={COLORS.success} style={{ marginRight: 8 }} />
              <Text style={styles.featureText}>Instant Token confirmation</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 size={18} color={COLORS.success} style={{ marginRight: 8 }} />
              <Text style={styles.featureText}>"You are next in line" queue reminder</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 size={18} color={COLORS.success} style={{ marginRight: 8 }} />
              <Text style={styles.featureText}>Heads-up alert when barber calls your name</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomActions}>
          <PrimaryButton
            title="Enable Push Notifications"
            onPress={handleEnableNotifications}
            isLoading={isRequesting}
            style={{ width: '100%', marginBottom: SPACING.md }}
          />
          <SecondaryButton
            title="Maybe Later"
            onPress={handleSkip}
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
  featureList: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    gap: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
  },
  bottomActions: {
    width: '100%',
  },
});
