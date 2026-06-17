import { Redirect } from 'expo-router';
import { useAuthStore } from '@stores/auth.store';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(onboarding)" />;
}
