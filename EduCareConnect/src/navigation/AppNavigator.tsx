import React from "react";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { useAuthStore } from "@store/authStore";
import { SplashScreen } from "@screens/auth/SplashScreen";
import { AuthNavigator } from "@navigation/AuthNavigator";
import { TeacherNavigator } from "@navigation/TeacherNavigator";
import { ParentNavigator } from "@navigation/ParentNavigator";

export const navigationRef = createNavigationContainerRef();

export function AppNavigator() {
  const { isLoading, isAuthenticated, role } = useAuthStore();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : role === "teacher" ? (
        <TeacherNavigator />
      ) : role === "parent" ? (
        <ParentNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
