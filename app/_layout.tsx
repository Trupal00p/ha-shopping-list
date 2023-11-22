// import "expo-dev-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { PaperProvider, Text, useTheme } from "react-native-paper";
import { SettingsProvider } from "../components/SettingContext";
import { SnackProvider } from "../components/SnackContext";
import { ErrorBoundary } from "react-error-boundary";
const queryClient = new QueryClient();

const ConfiguredStack = () => {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    />
  );
};

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={{ dark: false }}>
        <SettingsProvider>
          <SnackProvider>
            <ConfiguredStack />
          </SnackProvider>
        </SettingsProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
