import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { ArrowLeft, Plus, User, Coffee, Phone, X } from 'lucide-react-native';
import { Staff } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { Avatar } from '../../components/Avatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { api } from '../../services/api';

export const StaffManagementScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { salonId } = route.params || {};
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add staff modal
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Senior Stylist');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (salonId) {
      loadStaff();
    }
  }, [salonId]);

  const loadStaff = async () => {
    try {
      const res: any = await api.get(`/staff/salons/${salonId}/staff`);
      if (res.success && res.data) {
        setStaffList(res.data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async (staffMember: Staff) => {
    try {
      const newStatus = !staffMember.isAvailable;
      await api.patch(`/staff/${staffMember.id}`, { isAvailable: newStatus });
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffMember.id ? { ...s, isAvailable: newStatus } : s))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleStartBreak = async (staffId: string) => {
    Alert.alert('Staff Break', 'Send barber on a 30-minute tea/lunch break?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start 30m Break',
        onPress: async () => {
          try {
            await api.post(`/staff/${staffId}/break`, {
              durationMinutes: 30,
              reason: 'Tea / Lunch Break',
            });
            loadStaff();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleAddStaff = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Staff name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/staff/salons/${salonId}/staff`, {
        salonId,
        name: name.trim(),
        role: role.trim() || 'Senior Stylist',
        phone: phone.trim() || undefined,
      });

      setModalVisible(false);
      setName('');
      setPhone('');
      loadStaff();
      Alert.alert('Success', 'Staff barber added.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barbers & Stylists</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {staffList.map((st) => (
          <View key={st.id} style={styles.staffCard}>
            <View style={styles.staffHeader}>
              <Avatar url={st.avatarUrl} name={st.name} size={48} />
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{st.name}</Text>
                <Text style={styles.staffRole}>{st.role}</Text>
                {st.phone && <Text style={styles.staffPhone}>+91 {st.phone}</Text>}
              </View>

              <View style={styles.switchWrap}>
                <Text style={styles.availableLabel}>
                  {st.isAvailable ? 'Ready' : 'Off Chair'}
                </Text>
                <Switch
                  value={st.isAvailable}
                  onValueChange={() => toggleAvailability(st)}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={st.isAvailable ? COLORS.primary : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity
                onPress={() => handleStartBreak(st.id)}
                style={styles.breakBtn}
              >
                <Coffee size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.breakBtnText}>Log 30m Break</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Staff Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Stylist / Barber</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: SPACING.lg }}>
              <Text style={styles.label}>Barber Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Deepak Mishra"
                placeholderTextColor={COLORS.textTertiary}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Role / Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Senior Barber / Fade Specialist"
                placeholderTextColor={COLORS.textTertiary}
                value={role}
                onChangeText={setRole}
              />

              <Text style={styles.label}>Mobile Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit number"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />

              <PrimaryButton
                title="Add Barber"
                onPress={handleAddStaff}
                isLoading={isSubmitting}
                style={{ marginTop: SPACING.lg }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  staffCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  staffName: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '700',
  },
  staffRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  staffPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  switchWrap: {
    alignItems: 'center',
  },
  availableLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  breakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted,
  },
  breakBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    marginTop: SPACING.sm,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
});
