import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Options } from "ky";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const loadSettings = async () => {
  if (await SecureStore.isAvailableAsync()) {
    return Promise.all([
      SecureStore.getItemAsync("API_KEY"),
      SecureStore.getItemAsync("HOST"),
      SecureStore.getItemAsync("USE_TLS"),
      SecureStore.getItemAsync("SELECTED_LIST"),
    ]);
  } else if (!!window.localStorage) {
    return [
      localStorage.getItem("API_KEY"),
      localStorage.getItem("HOST"),
      localStorage.getItem("USE_TLS"),
      localStorage.getItem("SELECTED_LIST"),
    ];
  } else {
    return [null, null, null, null];
  }
};

type SettingsState = {
  apiKey?: string;
  host?: string;
  useTls?: boolean;
  selectedList?: string;
};

type SaveSettingsResult = Promise<[void, void, void, void]>;

type SettingsContext = {
  settings: SettingsState;
  saveSettings: (settings: SettingsState) => SaveSettingsResult;
  setSelectedList: (entityId: string) => SaveSettingsResult;
  requestOptions: Options;
};

const SettingsContext = createContext<SettingsContext>({
  settings: {},
  saveSettings: (settings: SettingsState) =>
    Promise.resolve([undefined, undefined, undefined, undefined]),
  setSelectedList: (entityId: string) =>
    Promise.resolve([undefined, undefined, undefined, undefined]),
  requestOptions: {},
});

export const useSettings = () => {
  return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }: { children: any }) => {
  // setup state container
  const [settings, setConfig] = useState<SettingsState>({});

  // load settings from storage
  useEffect(() => {
    loadSettings().then(([apiKey, host, useTls, selectedList]) => {
      if (apiKey && host) {
        setConfig({
          apiKey,
          host,
          useTls: useTls === "true",
          selectedList: selectedList || undefined,
        });
      } else {
        router.replace("/settings");
      }
    });
  }, [setConfig]);

  // function to update settings
  const saveSettings = async (settings: SettingsState): SaveSettingsResult => {
    let apiKey = settings?.apiKey?.trim() || "";
    let host = settings?.host?.trim() || "";
    let useTls = settings?.useTls ? "true" : "false";
    let selectedList = settings?.selectedList || "";

    setConfig({
      apiKey,
      host,
      useTls: settings?.useTls || false,
      selectedList: selectedList || undefined,
    });

    let result: SaveSettingsResult;
    if (await SecureStore.isAvailableAsync()) {
      result = Promise.all([
        SecureStore.setItemAsync("API_KEY", apiKey),
        SecureStore.setItemAsync("HOST", host),
        SecureStore.setItemAsync("USE_TLS", useTls),
        SecureStore.setItemAsync("SELECTED_LIST", selectedList),
      ]);
    } else if (!!window.localStorage) {
      result = Promise.resolve([
        localStorage.setItem("API_KEY", apiKey),
        localStorage.setItem("HOST", host),
        localStorage.setItem("USE_TLS", useTls),
        localStorage.setItem("SELECTED_LIST", selectedList),
      ]);
    } else {
      result = Promise.resolve([undefined, undefined, undefined, undefined]);
    }

    return result;
  };

  // function to update just the selected list
  const setSelectedList = async (entityId: string): SaveSettingsResult => {
    const newSettings = { ...settings, selectedList: entityId };
    return saveSettings(newSettings);
  };

  const requestOptions = useMemo(
    () => ({
      prefixUrl: `${settings.useTls ? "https" : "http"}://${settings.host}/`,
      retry: 1,
      headers: {
        authorization: `Bearer ${settings.apiKey}`,
      },
    }),
    [settings]
  );

  return (
    <SettingsContext.Provider
      value={{ settings, saveSettings, setSelectedList, requestOptions }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
