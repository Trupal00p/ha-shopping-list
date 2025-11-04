// import "expo-dev-client";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { PaperProvider, Text, useTheme } from "react-native-paper";
import { SettingsProvider } from "../components/SettingContext";
import { SnackProvider } from "../components/SnackContext";
import { ErrorBoundary } from "react-error-boundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      networkMode: "offlineFirst", // Queue when offline
      retry: 3,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "shopping-list-cache",
  throttleTime: 1000,
});

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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <PaperProvider theme={{ dark: false }}>
        <SettingsProvider>
          <SnackProvider>
            <ConfiguredStack />
          </SnackProvider>
        </SettingsProvider>
      </PaperProvider>
    </PersistQueryClientProvider>
  );
}
