import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Checkbox, FAB, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "../components/SettingContext";

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default function Details() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, saveSettings } = useSettings();

  const [apiKey, setApiKey] = useState("");
  const [host, setHost] = useState("");
  const [useTls, setUseTls] = useState(false);

  useEffect(() => {
    if (settings.apiKey && settings.host) {
      setApiKey(settings.apiKey);
      setHost(settings.host);
      setUseTls(settings.useTls || false);
    }
  }, [settings, setApiKey, setHost]);

  const [loading, setLoading] = useState(false);

  // save values
  const save = () => {
    setLoading(true);
    saveSettings({ apiKey, host, useTls }).finally(() => {
      setLoading(false);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    });
  };

  return (
    <View style={{ backgroundColor: theme.colors.background, height: "100%" }}>
      <Stack.Screen
        options={{
          headerTitle: "Settings",
        }}
      />
      <View style={{ padding: 20, height: "100%" }}>
        <TextInput
          mode="outlined"
          label="Host"
          placeholder="homeassistant.local:8123"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={host}
          onChangeText={(text) => setHost(text)}
        />
        <TextInput
          mode="outlined"
          label="Long-Lived Access Token"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          value={apiKey}
          onChangeText={(text) => setApiKey(text)}
          style={{ marginTop: 12 }}
        />
        <Checkbox.Item
          label="Use HTTPS (TLS)"
          status={useTls ? "checked" : "unchecked"}
          onPress={() => {
            setUseTls((tls) => !tls);
          }}
          position="leading"
          style={{ paddingHorizontal: 0 }}
        />

        <View style={{ height: 200 }} />
        <FAB
          icon="content-save"
          label="Save"
          // Edge-to-edge: keep clear of the system navigation bar
          style={[styles.fab, { marginBottom: 16 + insets.bottom }]}
          loading={loading}
          disabled={loading || !host.trim() || !apiKey.trim()}
          onPress={save}
        />
      </View>
    </View>
  );
}
