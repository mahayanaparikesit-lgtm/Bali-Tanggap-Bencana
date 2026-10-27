import { Stack } from "expo-router";
import { RoleGuard } from "@/components/RoleGuard";

export default function DonaturLayout() {
  return (
    <RoleGuard allowedRoles={["donatur"]}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
