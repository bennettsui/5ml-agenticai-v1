import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '../lib/auth';

function RouteGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === 'login' || segments[0] === 'signup';
    const inReception = segments[0] === 'reception';

    if (!isAuthenticated && !inAuth && !inReception) {
      router.replace('/login');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Handle push notification taps
  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (data?.event_id) {
        router.push(`/event/${data.event_id}`);
      }
    });
    return () => responseListener.current?.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RouteGuard />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: '#f1f5f9',
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: '#0f172a' },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="event/new"
            options={{ title: 'Create Event', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="event/[id]/index"
            options={{ title: 'Event', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="event/[id]/edit"
            options={{ title: 'Edit Event', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="event/[id]/attendees"
            options={{ title: 'Attendees', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="event/[id]/tiers"
            options={{ title: 'Ticket Tiers', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="event/[id]/form-fields"
            options={{ title: 'Form Fields', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="event/[id]/ai-studio"
            options={{ title: 'AI Studio', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="reception/index"
            options={{ title: 'Reception', headerShown: false }}
          />
          <Stack.Screen
            name="reception/[eventId]"
            options={{ title: 'Check-in', headerShown: false }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
