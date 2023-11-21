import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Stack } from "expo-router";
import ky from "ky";
import { useState } from "react";
import { AppRegistry, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Icon, List, Snackbar, useTheme } from "react-native-paper";
import { useSettings } from "../api";
import { AddItemInput } from "../components/AddItemInput";
import { ClearCompletedButton } from "../components/ClearCompletedButton";
import { useReactQuerySubscription } from "../components/useReactQuerySubscription";
import { ShoppingItem, ShoppingList } from "../types";

export default function App() {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [{ apiKey, host }] = useSettings();

  const requestOptions = {
    prefixUrl: `http://${host}`,
    headers: {
      authorization: `Bearer ${apiKey}`,
    },
  };

  const query = useQuery({
    queryKey: ["shopping_list"],
    enabled: !!apiKey && !!host,
    queryFn: async () => {
      const result =
        (await ky.get("api/shopping_list", requestOptions).json()) || [];
      return result;
    },
  });

  console.log(host)

  useReactQuerySubscription(apiKey, host);

  const [snackText, setSnackText] = useState<string | null>(null);
  const onDismissSnack = () => {
    setSnackText(null);
  };

  const toggleComplete = useMutation({
    mutationFn: (item: ShoppingItem) => {
      return ky.post(`api/shopping_list/item/${item.id}`, {
        ...requestOptions,
        json: {
          complete: !item.complete,
        },
      });
    },
    onMutate: async (item: ShoppingItem) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["shopping_list"] });
      // Snapshot the previous value
      const previousShoppingList: ShoppingList =
        queryClient.getQueryData(["shopping_list"]) || [];

      const itemIndex = previousShoppingList.findIndex((i) => i.id === item.id);

      let newShoppingList = [...previousShoppingList];

      newShoppingList[itemIndex] = { ...item, complete: !item.complete };

      // Optimistically update to the new value
      queryClient.setQueryData(["shopping_list"], newShoppingList);

      return { previousShoppingList, item };
    },
    onError: (err, newTodo, context) => {
      setSnackText("Failed To Save");
      queryClient.setQueryData(
        ["shopping_list"],
        context?.previousShoppingList
      );
    },
  });

  const { completed, todo } =
    query.data?.reduce(
      (acc, item) => {
        if (item.complete) {
          acc.completed.push(item);
        } else {
          acc.todo.push(item);
        }
        return acc;
      },
      { completed: [], todo: [] }
    ) || {};

  return (
    <View style={{ backgroundColor: theme.colors.background, height: "100%" }}>
      <Stack.Screen
        options={{
          headerTitle: "Shopping List",
          // headerLeft: () => (
          //   <Icon source="cart" size={22} color={theme.colors.primary} />
          // ),
          headerRight: () => (
            <View>
              <Link href={{ pathname: "settings" }}>
                <Icon source="cog" size={30} color={theme.colors.primary} />
              </Link>
            </View>
          ),
        }}
      />
      <ScrollView style={{ height: "100%" }}>
        <List.Section>
          {/* <List.Subheader>Items</List.Subheader> */}
          {todo?.map((item: ShoppingItem) => (
            <List.Item
              key={item.id}
              title={item.name}
              onPress={() => toggleComplete.mutate(item)}
              left={(props) => (
                <List.Icon
                  {...props}
                  color={
                    item.complete
                      ? theme.colors.primary
                      : theme.colors.secondary
                  }
                  icon={
                    item.complete ? "checkbox-marked" : "checkbox-blank-outline"
                  }
                />
              )}
            />
          ))}
        </List.Section>
        <List.Section>
          <List.Subheader>
            Completed{" "}
            <ClearCompletedButton
              requestOptions={requestOptions || {}}
              setSnackText={setSnackText}
            />
          </List.Subheader>
          {completed?.map((item: ShoppingItem) => (
            <List.Item
              key={item.id}
              title={item.name}
              onPress={() => toggleComplete.mutate(item)}
              left={(props) => (
                <List.Icon
                  {...props}
                  color={
                    item.complete
                      ? theme.colors.primary
                      : theme.colors.secondary
                  }
                  icon={
                    item.complete ? "checkbox-marked" : "checkbox-blank-outline"
                  }
                />
              )}
            />
          ))}
        </List.Section>
        <View style={{ height: 200 }} />
      </ScrollView>
      <AddItemInput
        requestOptions={requestOptions || {}}
        setSnackText={setSnackText}
      />
      <Snackbar
        visible={!!snackText}
        onDismiss={onDismissSnack}
        duration={2000}
      >
        {snackText}
      </Snackbar>
    </View>
  );
}

AppRegistry.registerComponent("Home Assitant Shopping", () => App);
// {/* //     <SafeAreaProvider>
// //       <SafeAreaView style={styles.container}>
// // <List setPage={setPage} api={api} />
// // page === "list" ? (
// // ) : page === "settings" ? (
// //   <Settings setPage={setPage} state={state} actions={actions} />
// // ) : null
// //       </SafeAreaView>
// //     </SafeAreaProvider> */}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    height: "100%",
    backgroundColor: "#fff",
    // alignItems: "center",
    // justifyContent: "center",
  },
});
