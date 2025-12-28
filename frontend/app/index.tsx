import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { session, isLoading, user } = useAuth();

  if (isLoading) {
    return null; // Let the layout handle loading state
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  const onboardingCompleted = user?.user_metadata?.onboarding_completed;
  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  // Default: redirect to home tab
  return <Redirect href="/home" />;
}
