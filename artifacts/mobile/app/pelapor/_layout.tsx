import { Stack } from "expo-router";
import { RoleGuard } from "@/components/RoleGuard";

export default function PelaporLayout() {
  return (
    <RoleGuard allowedRoles={["pelapor"]}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
