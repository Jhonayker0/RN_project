import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "./src/features/auth";

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </PaperProvider>
  );
}
