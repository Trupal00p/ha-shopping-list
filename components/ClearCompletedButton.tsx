import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme, IconButton, Button } from "react-native-paper";
import { ShoppingList } from "../types";
import ky, { Options } from "ky";

export function ClearCompletedButton({
  requestOptions,
  setSnackText,
}: {
  requestOptions: Options;
  setSnackText: (x: string) => void;
}) {
  const theme = useTheme();
  const queryClient = useQueryClient();
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
  return (
    <Button
      icon="notification-clear-all"
      mode="elevated"
      onPress={() => clearCompleted.mutate()}
    >
      Clear Completed
    </Button>
  );
}
