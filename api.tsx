import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

export const loadSettings = async () => {
  if (await SecureStore.isAvailableAsync()) {
    return Promise.all([
      SecureStore.getItemAsync("API_KEY"),
      SecureStore.getItemAsync("HOST"),
    ]);
  } else if (!!window.localStorage) {
    return [localStorage.getItem("API_KEY"), localStorage.getItem("HOST")];
  } else {
    return [null, null];
  }
};

type SettingsState = { apiKey?: string; host?: string };

type SettingsContext = [
  SettingsState,
  (apiKey: string, host: string) => Promise<[void, void]>,
];

const SettingsContext = createContext<SettingsContext>([
  {},
  () => Promise.resolve([undefined, undefined]),
]);

export const useSettings = () => {
  return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }: { children: any }) => {
  // setup state container
  const [settings, setConfig] = useState<SettingsState>({});

  // load settings from storage
  useEffect(() => {
    loadSettings().then(([apiKey, host]) => {
      if (apiKey && host) {
        setConfig({ apiKey, host });
      } else {
        router.replace("/settings");
      }
    });
  }, [setConfig]);

  // function to update settings
  const saveSettings = async (
    apiKey: string,
    host: string
  ): Promise<[void, void]> => {
    setConfig({ apiKey, host });
    if (await SecureStore.isAvailableAsync()) {
      return Promise.all([
        SecureStore.setItemAsync("API_KEY", apiKey),
        SecureStore.setItemAsync("HOST", apiKey),
      ]);
    } else if (!!window.localStorage) {
      return Promise.resolve([
        localStorage.setItem("API_KEY", apiKey),
        localStorage.setItem("HOST", host),
      ]);
    } else {
      return Promise.resolve([undefined, undefined]);
    }
  };

  return (
    <SettingsContext.Provider value={[settings, saveSettings]}>
      {children}
    </SettingsContext.Provider>
  );
};

// export const useApi = () => {
//   const [loading, setLoading] = useState(true);
//   const [requestOptions, setRequestOptions] = useState<Options | undefined>();

//   // load values
//   useEffect(() => {
//     loadSettings()
//       .then(([apiKey, host]) => {
//         if (apiKey && host) {
//           setRequestOptions({
//             prefixUrl: `http://${host}`,
//             headers: {
//               authorization: `Bearer ${apiKey}`,
//             },
//           });
//         } else {
//           router.replace("/settings");
//         }
//       })
//       .finally(() => {
//         setLoading(false);
//       });
//   }, [setLoading, setRequestOptions]);

//   return { requestOptions, loading };
// };
