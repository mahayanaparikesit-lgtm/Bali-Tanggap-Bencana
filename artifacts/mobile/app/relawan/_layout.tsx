import { Stack } from "expo-router";
import { RoleGuard } from "@/components/RoleGuard";

export default function RelawanLayout() {
  return (
    <RoleGuard allowedRoles={["relawan"]}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
