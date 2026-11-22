import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { ArrowLeft, DollarSign, CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme';
import { PriceLabel } from '../../components/Labels';
import { EmptyState } from '../../components/States';
import { api } from '../../services/api';

export const OwnerCommissionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCommission = useCallback(async () => {
    try {
      const res: any = await api.get('/owner/commission');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCommission();
  }, [fetchCommission]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchCommission();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Commission</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Policy Explanation Banner */}
        <View style={styles.policyBanner}>
          <Info size={18} color={COLORS.primary} style={{ marginRight: 8, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.policyTitle}>QueueCut Commission Model</Text>
            <Text style={styles.policyDesc}>
              QueueCut charges a flat 5% platform fee strictly on COMPLETED online app bookings.
              Walk-in customers added at your desk are 100% commission-exempt (₹0 fee).
            </Text>
          </View>
        </View>

        {/* Financial Highlights */}
        <View style={styles.highlightsContainer}>
          <View style={styles.highlightCard}>
            <Text style={styles.highlightLabel}>Total Due (Pending)</Text>
            <Text style={[styles.highlightAmount, { color: COLORS.warning }]}>
              ₹{data?.totalDue ?? 0}
            </Text>
          </View>

          <View style={styles.highlightCard}>
            <Text style={styles.highlightLabel}>Total Settled</Text>
            <Text style={[styles.highlightAmount, { color: COLORS.success }]}>
              ₹{data?.totalSettled ?? 0}
            </Text>
          </View>
        </View>

        <View style={styles.subSummaryRow}>
          <Text style={styles.subSummaryText}>
            Eligible Platform Bookings: <Text style={{ fontWeight: '800' }}>{data?.totalEligibleBookings ?? 0}</Text>
          </Text>
          <Text style={styles.subSummaryText}>
            Standard Platform Rate: <Text style={{ fontWeight: '800' }}>5.0%</Text>
          </Text>
        </View>

        {/* Ledger Transaction History */}
        <Text style={styles.ledgerHeader}>Immutable Ledger Records</Text>

        {!data?.ledgers || data.ledgers.length === 0 ? (
          <EmptyState
            title="No Commission Records Yet"
            description="Commission entries will appear here once online bookings are marked complete."
          />
        ) : (
          data.ledgers.map((entry: any) => {
            const isExempt = entry.status === 'NOT_ELIGIBLE';
            const isDue = entry.status === 'DUE';
            return (
              <View key={entry.id} style={styles.ledgerRow}>
                <View style={{ flex: 1, marginRight: SPACING.md }}>
                  <Text style={styles.ledgerToken}>
                    Token {entry.booking?.tokenNumber} ({entry.booking?.bookingSource})
                  </Text>
                  <Text style={styles.ledgerNotes} numberOfLines={1}>
                    {entry.notes}
                  </Text>
                  <Text style={styles.ledgerDate}>
                    {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.ledgerAmount, isExempt && { color: COLORS.textSecondary }]}>
                    {isExempt ? '₹0.00' : `₹${entry.amount.toFixed(2)}`}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isDue
                          ? COLORS.warningLight
                          : isExempt
                          ? COLORS.surfaceSubtle
                          : COLORS.successLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color: isDue
                            ? COLORS.warning
                            : isExempt
                            ? COLORS.textSecondary
                            : COLORS.success,
                        },
                      ]}
                    >
                      {entry.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  policyBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryMuted,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    marginBottom: SPACING.lg,
  },
  policyTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  policyDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  highlightsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  highlightLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  highlightAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  subSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  subSummaryText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  ledgerHeader: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  ledgerToken: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
  },
  ledgerNotes: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ledgerDate: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  ledgerAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusPill: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
});
