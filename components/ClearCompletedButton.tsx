import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme, IconButton } from "react-native-paper";
import { ShoppingList } from "../state/types";
import ky, { Options } from "ky";

export function ClearCompletedButton({
  requestOptions,
}: {
  requestOptions: Options;
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
      queryClient.setQueryData(
        ["shopping_list"],
        context?.previousShoppingList
      );
    },
  });
  return (
    <IconButton
      icon="notification-clear-all"
      iconColor={theme.colors.primary}
      size={20}
      // style={{ position: "absolute", right:5, top:5 }}
      onPress={() => clearCompleted.mutate()}
    />
  );
}
