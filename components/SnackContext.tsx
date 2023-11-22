import { createContext, useContext, useState } from "react";
import { Snackbar } from "react-native-paper";

const SnackContext = createContext<
  React.Dispatch<React.SetStateAction<string | null>>
>(() => undefined);

export const useSnack = () => {
  return useContext(SnackContext);
};

export const SnackProvider = ({ children }: { children: any }) => {
  const [snackText, setSnackText] = useState<string | null>(null);

  const onDismissSnack = () => {
    setSnackText(null);
  };
  return (
    <SnackContext.Provider value={setSnackText}>
      {children}
      <Snackbar
        visible={!!snackText}
        onDismiss={onDismissSnack}
        duration={2000}
      >
        {snackText}
      </Snackbar>
    </SnackContext.Provider>
  );
};
