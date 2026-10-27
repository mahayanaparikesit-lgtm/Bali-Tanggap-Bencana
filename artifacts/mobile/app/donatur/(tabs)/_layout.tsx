import { Tabs } from "expo-router";
import { colors, fonts } from "@/lib/theme";
import { BerandaIcon, LokasiIcon, RiwayatIcon, ProfilIcon } from "@/components/donasi/TabIcons";

export default function DonaturTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text3,
        tabBarStyle: {
          height: 82,
          paddingTop: 9,
          paddingBottom: 34,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.sansBold },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color }) => <BerandaIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="lokasi"
        options={{
          title: "Lokasi",
          tabBarIcon: ({ color }) => <LokasiIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="riwayat"
        options={{
          title: "Riwayat",
          tabBarIcon: ({ color }) => <RiwayatIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <ProfilIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
