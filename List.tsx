import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { Provider } from "react-redux";
import { store } from "./state/store";
import { useGetShoppingListQuery } from "./state/ha-api";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import ky from 'ky'

export default function ShoppingList() {
  
  const query = useQuery({
    queryKey: ["shopping_list"],
    queryFn: async () => {
      const result = await ky.get("/api/shopping_list", {
        headers: {
          authorization: `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`,
        },
      }).json();
      return result;
    },
  });

  console.log(query.data);
  return <Text>Something1! {process.env.EXPO_PUBLIC_TEST}</Text>;
}
