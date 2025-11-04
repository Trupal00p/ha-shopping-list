import { View } from "react-native";
import { Menu, Button, ActivityIndicator, Text } from "react-native-paper";
import { useState, useEffect } from "react";
import { useTodoLists } from "../hooks/useTodoLists";
import { useSettings } from "./SettingContext";

// Convert Home Assistant MDI icon to Material Community Icons format
const convertHAIcon = (icon?: string): string => {
  if (!icon) return "cart"; // Default to shopping cart icon
  // HA uses format like "mdi:cart", we need just "cart"
  return icon.replace("mdi:", "");
};

export function ListPicker() {
  const [visible, setVisible] = useState(false);
  const { data: lists, isLoading, isError } = useTodoLists();
  const { settings, setSelectedList } = useSettings();

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const selectedList = lists?.find(
    (list) => list.entity_id === settings.selectedList
  );

  const handleSelectList = (entityId: string) => {
    setSelectedList(entityId);
    closeMenu();
  };

  // Auto-select first list if none selected
  useEffect(() => {
    if (!settings.selectedList && lists && lists.length > 0) {
      setSelectedList(lists[0].entity_id);
    }
  }, [settings.selectedList, lists, setSelectedList]);

  if (isLoading) {
    return (
      <View style={{ padding: 10 }}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (isError || !lists || lists.length === 0) {
    return (
      <View style={{ padding: 10 }}>
        <Text>No todo lists found</Text>
      </View>
    );
  }

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <Button
          mode="text"
          onPress={openMenu}
          icon={convertHAIcon(selectedList?.icon)}
          compact
        >
          {selectedList?.name || "Select List"}
        </Button>
      }
    >
      {lists.map((list) => (
        <Menu.Item
          key={list.entity_id}
          onPress={() => handleSelectList(list.entity_id)}
          title={list.name}
          leadingIcon={convertHAIcon(list.icon)}
          trailingIcon={
            list.entity_id === settings.selectedList ? "check" : undefined
          }
        />
      ))}
    </Menu>
  );
}
