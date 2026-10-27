import { Stack } from "expo-router";
import { DonationFlowProvider } from "@/context/DonationFlowContext";

export default function DonationFlowLayout() {
  return (
    <DonationFlowProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DonationFlowProvider>
  );
}
