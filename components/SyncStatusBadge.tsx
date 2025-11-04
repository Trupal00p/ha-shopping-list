import { View } from "react-native";
import { Icon, useTheme } from "react-native-paper";

interface SyncStatusBadgeProps {
  isPending?: boolean;
}

export function SyncStatusBadge({ isPending }: SyncStatusBadgeProps) {
  const theme = useTheme();

  if (!isPending) {
    return null;
  }

  return (
    <View style={{ marginLeft: 8 }}>
      <Icon
        source="cloud-upload-outline"
        size={20}
        color={theme.colors.outline}
      />
    </View>
  );
}
