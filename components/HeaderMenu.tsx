import { Menu, IconButton } from "react-native-paper";
import { useState, useRef } from "react";
import { router } from "expo-router";

interface HeaderMenuProps {
  onClearCompleted: () => void;
  hasCompletedItems: boolean;
}

export function HeaderMenu({ onClearCompleted, hasCompletedItems }: HeaderMenuProps) {
  const [visible, setVisible] = useState(false);
  const justOpenedRef = useRef(false);

  const openMenu = () => {
    setVisible(true);
    justOpenedRef.current = true;
    // Allow dismissal after a short delay
    setTimeout(() => {
      justOpenedRef.current = false;
    }, 300);
  };

  const closeMenu = () => {
    if (!justOpenedRef.current) {
      setVisible(false);
    }
  };

  const handleSettings = () => {
    justOpenedRef.current = false;
    setVisible(false);
    router.push("/settings");
  };

  const handleClearCompleted = () => {
    justOpenedRef.current = false;
    setVisible(false);
    onClearCompleted();
  };

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <IconButton
          icon="dots-vertical"
          onPress={openMenu}
          size={24}
        />
      }
    >
      <Menu.Item
        onPress={handleClearCompleted}
        title="Clear Completed"
        leadingIcon="notification-clear-all"
        disabled={!hasCompletedItems}
      />
      <Menu.Item
        onPress={handleSettings}
        title="Settings"
        leadingIcon="cog"
      />
    </Menu>
  );
}
