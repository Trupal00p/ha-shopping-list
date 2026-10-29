import { useState } from "react";
import { TextInput } from "react-native-paper";

export function AddItemInput({ onAdd }: { onAdd: (summary: string) => void }) {
  const [newName, setNewName] = useState("");
  const summary = newName.trim();

  const onSubmit = () => {
    if (summary) {
      onAdd(summary);
      setNewName("");
    }
  };

  return (
    <TextInput
      label="New Item"
      mode="outlined"
      right={
        <TextInput.Icon icon="plus" onPress={onSubmit} disabled={!summary} />
      }
      enterKeyHint="enter"
      // Keep the keyboard up so several items can be added in a row
      blurOnSubmit={false}
      onSubmitEditing={onSubmit}
      value={newName}
      onChangeText={(value) => {
        setNewName(value);
      }}
    />
  );
}
