import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { onlineManager } from "@tanstack/react-query";

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Integrate with React Query's online manager
    const unsubscribe = onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state) => {
        const online = !!state.isConnected;
        const connected = state.isInternetReachable ?? true;

        setIsOnline(online);
        setIsConnected(connected);
        setOnline(online);
      });
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      const online = !!state.isConnected;
      const connected = state.isInternetReachable ?? true;

      setIsOnline(online);
      setIsConnected(connected);
      onlineManager.setOnline(online);
    });

    return unsubscribe;
  }, []);

  return { isOnline, isConnected };
};
