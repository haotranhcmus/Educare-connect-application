import { useEffect, useState } from "react";
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  type KeyboardEvent,
} from "react-native";

/**
 * Track the on-screen keyboard's height in real time.
 *
 * Why a manual listener instead of `KeyboardAvoidingView`:
 *   - `behavior="height"` on Android does not play well with Expo's
 *     `edgeToEdgeEnabled: true` (system does not resize the window, so KAV
 *     creates a phantom gap between the composer and the keyboard).
 *   - `behavior="padding"` on iOS needs a precise `keyboardVerticalOffset`
 *     that varies by device.
 *
 * Returning the raw height lets the caller decide how to apply it (typically
 * as `paddingBottom` on the screen root). On iOS we also schedule a
 * LayoutAnimation so the height change rides the same curve as the keyboard
 * slide-in/out animation.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      if (Platform.OS === "ios") {
        const dur = e.duration || 250;
        LayoutAnimation.configureNext({
          duration: dur,
          update: { type: "keyboard" as any, duration: dur },
        });
      }
      setHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, (e: KeyboardEvent) => {
      if (Platform.OS === "ios") {
        const dur = e?.duration || 250;
        LayoutAnimation.configureNext({
          duration: dur,
          update: { type: "keyboard" as any, duration: dur },
        });
      }
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
