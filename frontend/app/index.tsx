import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { session, isLoading, isBootstrapping, profile, user } = useAuth();

  // Wait for bootstrapping to complete (let layout handle loading UI)
  if (isLoading || isBootstrapping) {
    return null;
  }

  // No session → go to login
  if (!session) {
    return <Redirect href="/login" />;
  }

  // Has session but no profile AND no user_type selected → go to role selection
  // This catches users who signed in but haven't selected their role yet
  if (!profile && !user?.user_metadata?.user_type) {
    return <Redirect href="/role-selection" />;
  }

  // Has session and user_type but no profile → go to appropriate onboarding
  if (!profile && user?.user_metadata?.user_type) {
    const userType = user.user_metadata.user_type;
    if (userType === 'alumni') {
      return <Redirect href="/alumni-onboarding" />;
    } else if (userType === 'guest') {
      return <Redirect href="/guest-onboarding" />;
    }
    return <Redirect href="/onboarding" />;
  }

  // Has session and profile → go to home
  return <Redirect href="/home" />;
}
