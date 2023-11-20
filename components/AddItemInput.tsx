import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, TextInput } from "react-native-paper";
import { ShoppingList } from "../types";
import ky, { Options } from "ky";

export function AddItemInput({
  requestOptions,
  setSnackText,
}: {
  requestOptions: Options;
  setSnackText: (x: string) => void;
}) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
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
  return (
    <Card
      style={{
        position: "absolute",
        bottom: 30,
        left: 30,
        right: 30,
      }}
    >
      <TextInput
        label="New Item"
        mode="outlined"
        right={
          <TextInput.Icon
            icon="plus"
            onPress={() => {
              addNew.mutate(newName);
              setNewName("");
            }}
          />
        }
        enterKeyHint="enter"
        onKeyPress={(event) => {
          if (event.nativeEvent.key === "Enter") {
            addNew.mutate(newName);
            setNewName("");
          }
        }}
        value={newName}
        onChangeText={(value) => {
          setNewName(value);
        }}
      />
    </Card>
  );
}
