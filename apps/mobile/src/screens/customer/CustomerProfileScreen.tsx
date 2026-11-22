import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {
  User as UserIcon,
  Bell,
  MapPin,
  Heart,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { Avatar } from '../../components/Avatar';
import { ConfirmationSheet } from '../../components/ConfirmationSheet';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';

export const CustomerProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { localityName } = useLocationStore();

  const [bookingUpdates, setBookingUpdates] = useState(true);
  const [queueAlerts, setQueueAlerts] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <Avatar url={user?.avatarUrl} name={user?.name || 'Customer'} size={56} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
            <Text style={styles.userPhone}>+91 {user?.phone}</Text>
            {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>
        </View>

        {/* Location Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Location Preference</Text>
          <View style={styles.cardItem}>
            <MapPin size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>Selected Discovery Locality</Text>
              <Text style={styles.itemSubtitle}>{localityName}</Text>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Notification Preferences</Text>

          <View style={styles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>Booking & Token Updates</Text>
              <Text style={styles.itemSubtitle}>Get notified on token generation & status</Text>
            </View>
            <Switch
              value={bookingUpdates}
              onValueChange={setBookingUpdates}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={bookingUpdates ? COLORS.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>Queue Alerts ("Next in line")</Text>
              <Text style={styles.itemSubtitle}>Heads-up alert when barber is ready</Text>
            </View>
            <Switch
              value={queueAlerts}
              onValueChange={setQueueAlerts}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={queueAlerts ? COLORS.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Support & About</Text>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Help & Support',
                'For salon assistance or booking queries in Kanpur, reach out to support@queuecut.com.'
              )
            }
            style={styles.menuItem}
          >
            <HelpCircle size={20} color={COLORS.textSecondary} style={{ marginRight: 12 }} />
            <Text style={styles.menuTitle}>Help & Support</Text>
            <ChevronRight size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Terms of Service',
                'QueueCut provides digital queue reservation services for Indian salons. Platform commission of 5% applies to eligible online bookings.'
              )
            }
            style={styles.menuItem}
          >
            <FileText size={20} color={COLORS.textSecondary} style={{ marginRight: 12 }} />
            <Text style={styles.menuTitle}>Terms of Service</Text>
            <ChevronRight size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Privacy Policy',
                'We respect your privacy. Location and device tokens are used solely for queue updates and salon discovery.'
              )
            }
            style={styles.menuItem}
          >
            <ShieldCheck size={20} color={COLORS.textSecondary} style={{ marginRight: 12 }} />
            <Text style={styles.menuTitle}>Privacy Policy</Text>
            <ChevronRight size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={() => setLogoutModalVisible(true)}
          style={styles.logoutButton}
        >
          <LogOut size={18} color={COLORS.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>QueueCut v1.0.0 (Build 2026.11)</Text>
      </ScrollView>

      {/* Logout Confirmation Sheet */}
      <ConfirmationSheet
        visible={logoutModalVisible}
        title="Log Out of QueueCut?"
        message="You will need to sign back in with your mobile number or email."
        confirmLabel="Log Out"
        cancelLabel="Stay"
        isDestructive
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />
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
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  userInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.h3,
    marginBottom: 2,
  },
  userPhone: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  itemTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  itemSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  menuTitle: {
    ...TYPOGRAPHY.bodyMedium,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 14,
  },
  versionText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    color: COLORS.textTertiary,
    marginTop: SPACING.xl,
  },
});
