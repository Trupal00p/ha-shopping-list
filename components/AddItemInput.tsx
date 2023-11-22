import { UseMutationResult } from "@tanstack/react-query";
import { KyResponse } from "ky";
import { useState } from "react";
import { Card, TextInput } from "react-native-paper";
import { ShoppingList } from "../types";

export function AddItemInput({
  addMutation,
}: {
  addMutation: UseMutationResult<
    KyResponse,
    Error,
    string,
    {
      previousShoppingList: ShoppingList;
      name: string;
    }
  >;
}) {
  const [newName, setNewName] = useState("");

  const onSubmit = () => {
    if (!!newName) {
      addMutation.mutate(newName);
      setNewName("");
    }
  };

  return (
    <TextInput
      label="New Item"
      mode="outlined"
      right={<TextInput.Icon icon="plus" onPress={onSubmit} />}
      enterKeyHint="enter"
      onSubmitEditing={onSubmit}
      value={newName}
      onChangeText={(value) => {
        setNewName(value);
      }}
    />
  );
}
