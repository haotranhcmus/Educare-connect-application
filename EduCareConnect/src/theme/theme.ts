import { MD3LightTheme, configureFonts } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

const fontConfig = {
  fontFamily: "System",
};

export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary palette
    primary: "#2E7D32",
    onPrimary: "#FFFFFF",
    primaryContainer: "#C8E6C9",
    onPrimaryContainer: "#1B5E20",

    // Secondary
    secondary: "#558B2F",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#DCEDC8",
    onSecondaryContainer: "#33691E",

    // Tertiary
    tertiary: "#00695C",
    onTertiary: "#FFFFFF",
    tertiaryContainer: "#B2DFDB",
    onTertiaryContainer: "#004D40",

    // Error
    error: "#B00020",
    onError: "#FFFFFF",
    errorContainer: "#FDECEA",
    onErrorContainer: "#B00020",

    // Background & Surface
    background: "#F1F8F1",
    onBackground: "#1C1B1F",
    surface: "#FAFDF6",
    onSurface: "#1C1B1F",
    surfaceVariant: "#e9eaebbf",
    onSurfaceVariant: "#000",

    // Outline
    outline: "#4d4b508f",
    outlineVariant: "#CAC4D0",

    // Misc
    shadow: "#000000",
    scrim: "#000000",
    inverseSurface: "#313033",
    inverseOnSurface: "#F4EFF4",
    inversePrimary: "#A5D6A7",

    elevation: {
      level0: "transparent",
      level1: "#F7F2FA",
      level2: "#F1F8F1",
      level3: "#EDEAF5",
      level4: "#EBE8F3",
      level5: "#E8E5F0",
    },

    surfaceDisabled: "rgba(28, 27, 31, 0.12)",
    onSurfaceDisabled: "rgba(28, 27, 31, 0.38)",
    backdrop: "rgba(50, 47, 55, 0.4)",
  },
  fonts: configureFonts({ config: fontConfig }),
};
