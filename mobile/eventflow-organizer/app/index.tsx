import { Redirect } from 'expo-router';

// Redirect root to login (route guard in _layout.tsx handles auth)
export default function Index() {
  return <Redirect href="/login" />;
}
