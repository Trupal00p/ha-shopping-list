import * as SecureStore from "expo-secure-store";
import { Options } from "ky/distribution/types/options";
import { useEffect, useState } from "react";

export const useApi = () => {
  const [loading, setLoading] = useState(true);
  const [requestOptions, setRequestOptions] = useState<Options | undefined>();

  // load values
  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync("API_KEY"),
      SecureStore.getItemAsync("HOST"),
    ]).then(([apiKey, host]) => {
      if (apiKey && host) {
        setRequestOptions({
          prefixUrl: `https://${host}`,
          headers: {
            authorization: `Bearer ${apiKey}`,
          },
        });
      }
      setLoading(false);
    });
  }, [setLoading, setRequestOptions]);

  return { requestOptions, loading };
};
