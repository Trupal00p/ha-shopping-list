import { Link, Stack } from "expo-router";
import { ErrorBoundary } from "react-error-boundary";
import { AppRegistry, View } from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";
import { ShoppingListView } from "../components/ShoppingList";

export default function Wrapper() {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background, height: "100%" }}>
      <Stack.Screen
        options={{
          headerTitle: "Shopping List",
          headerRight: () => (
            <View>
              <Link href={{ pathname: "settings" }}>
                <Icon source="cog" size={30} color={theme.colors.primary} />
              </Link>
            </View>
          ),
        }}
      />
      <ErrorBoundary fallback={<Text>Something went wrong</Text>}>
        <ShoppingListView />
      </ErrorBoundary>
    </View>
  );
}
AppRegistry.registerComponent("Home Assistant Shopping List", () => App);
