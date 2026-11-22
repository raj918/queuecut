import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Store,
  MapPin,
  Clock,
  Phone,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { Avatar } from '../../components/Avatar';
import { ConfirmationSheet } from '../../components/ConfirmationSheet';
import { useAuthStore } from '../../store/authStore';

export const OwnerProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const salon = user?.ownedSalons?.[0];

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Owner Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Owner & Salon Card */}
        <View style={styles.userCard}>
          <Avatar url={user?.avatarUrl} name={user?.name || 'Owner'} size={56} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Salon Manager'}</Text>
            <Text style={styles.salonNameTag}>{salon?.name || 'My Salon'}</Text>
            <Text style={styles.userPhone}>+91 {user?.phone}</Text>
          </View>
        </View>

        {/* Salon Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Salon Information</Text>

          <View style={styles.cardItem}>
            <Store size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>Business Name</Text>
              <Text style={styles.itemSubtitle}>{salon?.name || 'Registered Salon'}</Text>
            </View>
          </View>

          <View style={styles.cardItem}>
            <MapPin size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>Locality</Text>
              <Text style={styles.itemSubtitle}>{salon?.locality || 'Civil Lines, Kanpur'}</Text>
            </View>
          </View>
        </View>

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Platform Policies</Text>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Queue Engine Policy',
                'One daily token sequence (Q-001, Q-002, ...) per salon business date. Tokens are atomic and non-reusable upon cancellation.'
              )
            }
            style={styles.menuItem}
          >
            <ShieldCheck size={20} color={COLORS.textSecondary} style={{ marginRight: 12 }} />
            <Text style={styles.menuTitle}>QueueCut Rules & Security</Text>
            <ChevronRight size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Owner Support Desk',
                'Need help setting up staff schedules or services? Email partner@queuecut.com or call our Kanpur partner hotline.'
              )
            }
            style={styles.menuItem}
          >
            <HelpCircle size={20} color={COLORS.textSecondary} style={{ marginRight: 12 }} />
            <Text style={styles.menuTitle}>Partner Support</Text>
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

        <Text style={styles.versionText}>QueueCut Salon Partner v1.0.0</Text>
      </ScrollView>

      {/* Logout Confirmation Sheet */}
      <ConfirmationSheet
        visible={logoutModalVisible}
        title="Log Out of Partner App?"
        message="You will need to sign back in with your mobile number."
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
  salonNameTag: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
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
