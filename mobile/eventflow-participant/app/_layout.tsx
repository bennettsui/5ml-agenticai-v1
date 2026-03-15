import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '../lib/notifications';

export default function RootLayout() {
  const router = useRouter();
  const notifListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push on startup (non-blocking)
    registerForPushNotifications().catch(() => {});

    // Notification received while app is open
    notifListener.current = Notifications.addNotificationReceivedListener(() => {});

    // User tapped a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (data?.registration_code) {
        router.push(`/ticket/${data.registration_code}`);
      } else if (data?.event_slug) {
        router.push(`/event/${data.event_slug}`);
      }
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f1f5f9',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#0f172a' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="event/[slug]"
          options={{ title: 'Event Details', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="rsvp/[slug]"
          options={{ title: 'Register', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="ticket/[code]"
          options={{ title: 'My Ticket', headerBackTitle: 'Back' }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
