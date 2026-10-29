import { useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";

// onlineManager is wired to NetInfo in app/_layout.tsx
const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const getIsOnline = () => onlineManager.isOnline();

export const useNetworkStatus = () => {
  const isOnline = useSyncExternalStore(subscribe, getIsOnline);
  return { isOnline };
};
