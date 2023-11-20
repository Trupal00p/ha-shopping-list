import { Stack, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FAB, TextInput, useTheme } from "react-native-paper";

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
  const [apiKey, setApiKey] = useState("");
  const [host, setHost] = useState("");
  const [loading, setLoading] = useState(true);

  // load values
  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync("API_KEY"),
      SecureStore.getItemAsync("HOST"),
    ]).then(([apiKey, host]) => {
      setApiKey(apiKey || "");
      setHost(host || "");
      setLoading(false);
    });
  }, [setLoading, setApiKey, setHost]);

  // save values
  const save = () => {
    setLoading(true);
    Promise.all([
      SecureStore.setItemAsync("API_KEY", apiKey),
      SecureStore.setItemAsync("HOST", host),
    ]).finally(() => {
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
          value={host}
          onChangeText={(text) => setHost(text)}
        />
        <TextInput
          mode="outlined"
          label="API Key"
          value={apiKey}
          onChangeText={(text) => setApiKey(text)}
        />
        <View style={{ height: 200 }} />
        <FAB
          icon="content-save"
          label="Save"
          style={styles.fab}
          onPress={save}
        />
      </View>
    </View>
  );
}
