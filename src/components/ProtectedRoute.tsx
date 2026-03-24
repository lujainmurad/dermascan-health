import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'patient' | 'clinician';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.email_confirmed_at) return <Navigate to="/verify-email" replace />;
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={profile?.role === 'clinician' ? '/clinician/dashboard' : '/patient/dashboard'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
