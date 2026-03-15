import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
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
