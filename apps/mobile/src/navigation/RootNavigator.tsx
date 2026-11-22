import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../theme';
import { useAuthStore } from '../store/authStore';

// Onboarding & Auth
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { LocationPermissionScreen } from '../screens/onboarding/LocationPermissionScreen';
import { NotificationPermissionScreen } from '../screens/onboarding/NotificationPermissionScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Navigation Stacks
import { CustomerTabs } from './CustomerTabs';
import { OwnerTabs } from './OwnerTabs';

// Customer Flow Modal Screens
import { DiscoveryMapScreen } from '../screens/customer/DiscoveryMapScreen';
import { SalonDetailsScreen } from '../screens/customer/SalonDetailsScreen';
import { BookingConfirmationScreen } from '../screens/customer/BookingConfirmationScreen';
import { LiveQueueScreen } from '../screens/customer/LiveQueueScreen';

// Owner Flow Modal Screens
import { LiveQueueManagementScreen } from '../screens/owner/LiveQueueManagementScreen';
import { ServicesManagementScreen } from '../screens/owner/ServicesManagementScreen';
import { StaffManagementScreen } from '../screens/owner/StaffManagementScreen';
import { OwnerCommissionScreen } from '../screens/owner/OwnerCommissionScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated, role, isLoading, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthenticated ? (
          // Unauthenticated Flow
          <Stack.Group>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
            <Stack.Screen name="NotificationPermission" component={NotificationPermissionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        ) : role === 'CUSTOMER' ? (
          // Customer Authenticated Flow
          <Stack.Group>
            <Stack.Screen name="CustomerMain" component={CustomerTabs} />
            <Stack.Screen name="DiscoveryMap" component={DiscoveryMapScreen} />
            <Stack.Screen name="SalonDetails" component={SalonDetailsScreen} />
            <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
            <Stack.Screen name="LiveQueue" component={LiveQueueScreen} />
          </Stack.Group>
        ) : (
          // Salon Owner Authenticated Flow
          <Stack.Group>
            <Stack.Screen name="OwnerMain" component={OwnerTabs} />
            <Stack.Screen name="LiveQueueManagement" component={LiveQueueManagementScreen} />
            <Stack.Screen name="ServicesManagement" component={ServicesManagementScreen} />
            <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
            <Stack.Screen name="OwnerCommission" component={OwnerCommissionScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
