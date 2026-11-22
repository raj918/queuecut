export const COLORS = {
  // Brand
  primary: '#0F766E', // Deep sophisticated teal
  primaryDark: '#115E59',
  primaryLight: '#CCFBF1',
  primaryMuted: '#F0FDFA',

  // Surfaces & Backgrounds
  background: '#F7F8FA', // Clean light grey
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F3F4',
  border: '#E8EAED',
  borderLight: '#F3F4F6',

  // Typography
  textPrimary: '#1A1D20', // Deep charcoal
  textSecondary: '#5F6368', // Muted grey
  textTertiary: '#9AA0A6',
  textInverse: '#FFFFFF',

  // Semantic Status
  success: '#16A34A', // Restrained emerald
  successLight: '#DCFCE7',
  warning: '#D97706', // Warm amber
  warningLight: '#FEF3C7',
  error: '#DC2626', // Restrained crimson
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // Badges & Indicators
  waiting: '#D97706',
  called: '#0284C7',
  inService: '#0F766E',
  completed: '#16A34A',
  cancelled: '#DC2626',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const TYPOGRAPHY = {
  h1: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.4, color: COLORS.textPrimary },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3, color: COLORS.textPrimary },
  h3: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2, color: COLORS.textPrimary },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, color: COLORS.textPrimary },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, color: COLORS.textPrimary },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, color: COLORS.textSecondary },
  caption: { fontSize: 11, fontWeight: '500' as const, color: COLORS.textSecondary },
  button: { fontSize: 15, fontWeight: '600' as const },
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
};
