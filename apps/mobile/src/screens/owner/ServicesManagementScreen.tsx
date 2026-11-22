import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { ArrowLeft, Plus, Scissors, Clock, Trash2, X } from 'lucide-react-native';
import { Service } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { PrimaryButton, SecondaryButton } from '../../components/PrimaryButton';
import { PriceLabel } from '../../components/Labels';
import { api } from '../../services/api';

export const ServicesManagementScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { salonId } = route.params || {};
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Service Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Haircut');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('25');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (salonId) {
      loadServices();
    }
  }, [salonId]);

  const loadServices = async () => {
    try {
      const res: any = await api.get(`/services/salons/${salonId}/services`);
      if (res.success && res.data) {
        setServices(res.data);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!name.trim() || !price.trim() || !duration.trim()) {
      Alert.alert('Required', 'Please fill name, price, and duration.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/services/salons/${salonId}/services`, {
        salonId,
        name: name.trim(),
        category,
        price: parseFloat(price),
        durationMinutes: parseInt(duration, 10),
        description: description.trim() || undefined,
      });

      setModalVisible(false);
      setName('');
      setPrice('');
      setDescription('');
      loadServices();
      Alert.alert('Success', 'New service added to your salon menu.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    Alert.alert(
      'Disable Service',
      'Are you sure you want to disable this service from new bookings? (Historical booking receipts are unaffected).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/services/${serviceId}`);
              loadServices();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services & Pricing</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {services.map((srv) => (
          <View key={srv.id} style={styles.serviceCard}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{srv.name}</Text>
                <Text style={styles.categoryBadge}>{srv.category}</Text>
              </View>
              <PriceLabel price={srv.price} size="medium" />
            </View>

            {srv.description && (
              <Text style={styles.serviceDescription} numberOfLines={2}>
                {srv.description}
              </Text>
            )}

            <View style={styles.cardFooter}>
              <View style={styles.durationWrap}>
                <Clock size={13} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.durationText}>{srv.durationMinutes} minutes</Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteService(srv.id)}
                style={styles.deleteBtn}
                accessibilityLabel="Disable service"
              >
                <Trash2 size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Service Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Service</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
              <Text style={styles.label}>Service Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Skin Fade Haircut"
                placeholderTextColor={COLORS.textTertiary}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Haircut, Beard, Facial"
                placeholderTextColor={COLORS.textTertiary}
                value={category}
                onChangeText={setCategory}
              />

              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Price (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="150"
                    placeholderTextColor={COLORS.textTertiary}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Duration (Mins) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="25"
                    placeholderTextColor={COLORS.textTertiary}
                    keyboardType="numeric"
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Brief description of the service"
                placeholderTextColor={COLORS.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <PrimaryButton
                title="Save Service"
                onPress={handleAddService}
                isLoading={isSubmitting}
                style={{ marginTop: SPACING.lg }}
              />
            </ScrollView>
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
  serviceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceName: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '700',
  },
  categoryBadge: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  serviceDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginVertical: SPACING.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  durationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  deleteBtn: {
    padding: SPACING.xs,
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
