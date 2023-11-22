import { useMutation, useQueryClient } from "@tanstack/react-query";
import ky from "ky";
import { ShoppingItem, ShoppingList } from "../types";
import { useSettings } from "../components/SettingContext";
import { useSnack } from "../components/SnackContext";

export function useMutations() {
  const { requestOptions } = useSettings();
  const queryClient = useQueryClient();
  const setSnackText = useSnack();

  const toggle = useMutation({
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

  const clearCompleted = useMutation({
    mutationFn: () =>
      ky.post(`api/shopping_list/clear_completed`, requestOptions),
    onMutate: async () => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["shopping_list"] });
      // Snapshot the previous value
      const previousShoppingList: ShoppingList =
        queryClient.getQueryData(["shopping_list"]) || [];

      // filter completed locally
      let newShoppingList = previousShoppingList.filter(
        (i) => i.complete === false
      );

      // Optimistically update to the new value
      queryClient.setQueryData(["shopping_list"], newShoppingList);

      return { previousShoppingList };
    },
    onError: (err, newTodo, context) => {
      setSnackText("Failed To Save");
      queryClient.setQueryData(
        ["shopping_list"],
        context?.previousShoppingList
      );
    },
  });

  const addNew = useMutation({
    mutationFn: (name: string) =>
      ky.post(`api/shopping_list/item`, {
        ...requestOptions,
        json: {
          name,
        },
      }),
    onMutate: async (name: string) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["shopping_list"] });
      // Snapshot the previous value
      const previousShoppingList: ShoppingList =
        queryClient.getQueryData(["shopping_list"]) || [];

      let newShoppingList = [
        ...previousShoppingList,
        {
          name,
          completed: false,
          id: (Math.random() + 1).toString(36).substring(7),
        },
      ];

      // Optimistically update to the new value
      queryClient.setQueryData(["shopping_list"], newShoppingList);
      return { previousShoppingList, name };
    },
    onError: (err, newTodo, context) => {
      setSnackText("Failed To Save");
      queryClient.setQueryData(
        ["shopping_list"],
        context?.previousShoppingList
      );
    },
  });

  return { toggle, addNew, clearCompleted };
}
