import { config as defaultConfig } from "@gluestack-ui/config";

export const config = {
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    colors: {
      ...defaultConfig.tokens.colors,
      // Map theme colors
      primary50: "#E8F5E9",
      primary100: "#C8E6C9",
      primary200: "#A5D6A7",
      primary300: "#81C784",
      primary400: "#66BB6A",
      primary500: "#2E7D32", // primary
      primary600: "#2E7D32",
      primary700: "#1B5E20",
      // Background & Surface
      backgroundLight: "#F1F8F1",
      surfaceLight: "#FAFDF6",
    },
  },
};
