import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth, type UserRole } from "@/context/AuthContext";
import { colors } from "@/lib/theme";

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/login", // admin tidak punya UI di mobile — lihat catatan di app/login.tsx
  relawan: "/relawan",
  pelapor: "/pelapor",
  donatur: "/donatur",
};

export function RoleGuard({ allowedRoles, children }: { allowedRoles: UserRole[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Redirect href={ROLE_HOME[user.role] as any} />;
  }

  return <>{children}</>;
}
