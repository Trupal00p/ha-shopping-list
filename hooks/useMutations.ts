import { useMutation, useQueryClient } from "@tanstack/react-query";
import ky from "ky";
import { ShoppingItem, ShoppingList } from "../types";
import { useSettings } from "../components/SettingContext";
import { useSnack } from "../components/SnackContext";
import { onlineManager } from "@tanstack/react-query";

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
    networkMode: "offlineFirst",
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onMutate: async (item: ShoppingItem) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["shopping_list"] });
      // Snapshot the previous value
      const previousShoppingList: ShoppingList =
        queryClient.getQueryData(["shopping_list"]) || [];

      const itemIndex = previousShoppingList.findIndex((i) => i.id === item.id);

      let newShoppingList = [...previousShoppingList];

      newShoppingList[itemIndex] = {
        ...item,
        complete: !item.complete,
        _pending: true,
        _timestamp: Date.now(),
      };

      // Optimistically update to the new value
      queryClient.setQueryData(["shopping_list"], newShoppingList);

      return { previousShoppingList, item };
    },
    onSuccess: (data, item) => {
      // Clear pending flag after successful sync
      const currentList: ShoppingList =
        queryClient.getQueryData(["shopping_list"]) || [];
      const updated = currentList.map((i) =>
        i.id === item.id ? { ...i, _pending: false } : i
      );
      queryClient.setQueryData(["shopping_list"], updated);
    },
    onError: (err, item, context) => {
      const isOnline = onlineManager.isOnline();
      if (!isOnline) {
        setSnackText("Saved locally. Will sync when online.");
      } else {
        setSnackText("Failed To Save");
        queryClient.setQueryData(
          ["shopping_list"],
          context?.previousShoppingList
        );
      }
    },
  });

  const clearCompleted = useMutation({
    mutationFn: () =>
      ky.post(`api/shopping_list/clear_completed`, requestOptions),
    networkMode: "offlineFirst",
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
    onSuccess: () => {
      // Refetch to ensure we're in sync with server
      queryClient.invalidateQueries({ queryKey: ["shopping_list"] });
    },
    onError: (err, variables, context) => {
      const isOnline = onlineManager.isOnline();
      if (!isOnline) {
        setSnackText("Saved locally. Will sync when online.");
      } else {
        setSnackText("Failed To Save");
        queryClient.setQueryData(
          ["shopping_list"],
          context?.previousShoppingList
        );
      }
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
    networkMode: "offlineFirst",
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onMutate: async (name: string) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["shopping_list"] });
      // Snapshot the previous value
      const previousShoppingList: ShoppingList =
        queryClient.getQueryData(["shopping_list"]) || [];

      const tempId = `temp-${(Math.random() + 1).toString(36).substring(7)}`;
      let newShoppingList = [
        ...previousShoppingList,
        {
          name,
          complete: false,
          id: tempId,
          _pending: true,
          _timestamp: Date.now(),
        },
      ];

      // Optimistically update to the new value
      queryClient.setQueryData(["shopping_list"], newShoppingList);
      return { previousShoppingList, name, tempId };
    },
    onSuccess: (data, name, context) => {
      // Replace temp item with real one from server
      queryClient.invalidateQueries({ queryKey: ["shopping_list"] });
    },
    onError: (err, name, context) => {
      const isOnline = onlineManager.isOnline();
      if (!isOnline) {
        setSnackText("Saved locally. Will sync when online.");
      } else {
        setSnackText("Failed To Save");
        queryClient.setQueryData(
          ["shopping_list"],
          context?.previousShoppingList
        );
      }
    },
  });

  return { toggle, addNew, clearCompleted };
}
