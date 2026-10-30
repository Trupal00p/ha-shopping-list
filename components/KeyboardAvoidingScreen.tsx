import { ReactNode, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  StyleProp,
  View,
  ViewInstance,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// With edge-to-edge (mandatory on Android since SDK 55) the window no longer
// shrinks for the keyboard. KeyboardAvoidingView measures itself relative to
// its parent, so offset it by where the screen starts below the header. The
// bottom inset is subtracted because content already pads for the navigation
// bar, which the keyboard covers.
export function KeyboardAvoidingScreen({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const ref = useRef<ViewInstance>(null);
  const insets = useSafeAreaInsets();
  const [top, setTop] = useState(0);

  return (
    <View
      ref={ref}
      style={[{ flex: 1 }, style]}
      onLayout={() => ref.current?.measureInWindow((_x, y) => setTop(y))}
    >
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={top - insets.bottom}
        style={{ flex: 1 }}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}
