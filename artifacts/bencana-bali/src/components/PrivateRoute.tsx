import { Redirect, useLocation } from "wouter";
import { useAuth, type UserRole } from "@/context/AuthContext";

interface PrivateRouteProps {
  component: React.ComponentType<any>;
  allowedRoles?: UserRole[];
  [key: string]: any;
}

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  relawan: "/relawan",
  pelapor: "/pelapor",
  donatur: "/donatur",
};

export function PrivateRoute({ component: Component, allowedRoles, ...props }: PrivateRouteProps) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location);
    return <Redirect to={`/login?redirect=${redirect}`} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to={ROLE_HOME[user.role]} />;
  }

  return <Component {...props} />;
}
