declare module "*.svg" {
  import React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}

// Expo inlines EXPO_PUBLIC_* vars at bundle time via Metro.
// This declaration makes TypeScript aware of process.env without
// pulling in all of @types/node (which can conflict with react-native types).
declare const process: {
  env: {
    EXPO_PUBLIC_ODOO_URL?: string;
    EXPO_PUBLIC_ODOO_DB?: string;
    NODE_ENV: "development" | "production" | "test";
    [key: string]: string | undefined;
  };
};
