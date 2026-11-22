import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './navigation/RootNavigator';
import { MobileNotificationService } from './services/notifications';
import { COLORS } from './theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export default function App() {
  useEffect(() => {
    // Setup Android notification channels & foreground listener
    MobileNotificationService.setupChannels().catch(console.warn);
    const unsubscribe = MobileNotificationService.setupForegroundListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
