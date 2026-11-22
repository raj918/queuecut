import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Service, Staff } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { PrimaryButton, SecondaryButton } from '../../components/PrimaryButton';
import { PriceLabel } from '../../components/Labels';
import { api } from '../../services/api';

interface AddWalkInModalProps {
  visible: boolean;
  salonId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddWalkInModal: React.FC<AddWalkInModalProps> = ({
  visible,
  salonId,
  onClose,
  onSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && salonId) {
      loadSalonData();
    }
  }, [visible, salonId]);

  const loadSalonData = async () => {
    try {
      const [srvRes, stfRes]: any = await Promise.all([
        api.get(`/services/salons/${salonId}/services`),
        api.get(`/staff/salons/${salonId}/staff`),
      ]);
      if (srvRes.success && srvRes.data) {
        setServices(srvRes.data);
        if (srvRes.data.length > 0) {
          setSelectedServiceIds([srvRes.data[0].id]);
        }
      }
      if (stfRes.success && stfRes.data) {
        setStaffList(stfRes.data);
      }
    } catch (e) {
      console.warn('Error loading walk-in dependencies:', e);
    }
  };

  const toggleService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      if (selectedServiceIds.length === 1) return;
      setSelectedServiceIds(selectedServiceIds.filter((sId) => sId !== id));
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
    }
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      Alert.alert('Required', 'Please enter customer name.');
      return;
    }

    if (selectedServiceIds.length === 0) {
      Alert.alert('Required', 'Please select at least one service.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res: any = await api.post('/queue/walk-in', {
        salonId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        serviceIds: selectedServiceIds,
        staffId: selectedStaffId,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.data) {
        Alert.alert(
          'Walk-in Added',
          `Token ${res.data.tokenNumber} successfully generated and queued!`
        );
        onSuccess();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add walk-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Walk-in Customer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll}>
            <Text style={styles.label}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={COLORS.textTertiary}
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.label}>Mobile Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="phone-pad"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              maxLength={10}
            />

            {/* Select Services */}
            <Text style={styles.label}>Select Services *</Text>
            <View style={styles.servicesWrap}>
              {services.map((srv) => {
                const isSelected = selectedServiceIds.includes(srv.id);
                return (
                  <TouchableOpacity
                    key={srv.id}
                    onPress={() => toggleService(srv.id)}
                    style={[styles.serviceChip, isSelected && styles.selectedServiceChip]}
                  >
                    <View style={[styles.checkCircle, isSelected && styles.checkedCircle]}>
                      {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                    </View>
                    <Text style={[styles.serviceChipText, isSelected && { color: COLORS.primaryDark, fontWeight: '700' }]}>
                      {srv.name} (₹{srv.price})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Barber Assignment */}
            <Text style={styles.label}>Assign Barber</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffRow}>
              <TouchableOpacity
                onPress={() => setSelectedStaffId(null)}
                style={[styles.staffSelectChip, selectedStaffId === null && styles.selectedStaffSelectChip]}
              >
                <Text style={[styles.staffSelectText, selectedStaffId === null && { color: '#fff' }]}>
                  Any Available
                </Text>
              </TouchableOpacity>

              {staffList.map((st) => (
                <TouchableOpacity
                  key={st.id}
                  onPress={() => setSelectedStaffId(st.id)}
                  style={[styles.staffSelectChip, selectedStaffId === st.id && styles.selectedStaffSelectChip]}
                >
                  <Text style={[styles.staffSelectText, selectedStaffId === st.id && { color: '#fff' }]}>
                    {st.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Special instructions or preferences"
              placeholderTextColor={COLORS.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {/* Price Preview */}
            <View style={styles.priceSummaryRow}>
              <Text style={styles.priceSummaryLabel}>Total Service Amount:</Text>
              <PriceLabel price={totalPrice} size="medium" />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <SecondaryButton title="Cancel" onPress={onClose} style={{ flex: 1, marginRight: SPACING.sm }} />
            <PrimaryButton
              title="Generate Token"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              style={{ flex: 1.5, marginLeft: SPACING.sm }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
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
  closeBtn: {
    padding: SPACING.xs,
  },
  formScroll: {
    padding: SPACING.lg,
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
  servicesWrap: {
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedServiceChip: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  checkedCircle: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  serviceChipText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
  },
  staffRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  staffSelectChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSubtle,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedStaffSelectChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  staffSelectText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  priceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryMuted,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  priceSummaryLabel: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
});
