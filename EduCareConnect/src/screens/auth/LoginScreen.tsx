import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  HelperText,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "../../store/authStore";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const theme = useTheme();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    await login(data.email, data.password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container} // Bỏ padding và background ở đây
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View
          style={[
            styles.topSection,
            { backgroundColor: theme.colors.primaryContainer }, // <-- TÔ MÀU NỀN TRÊN Ở ĐÂY
          ]}
        >
          {/* GIỮ NGUYÊN KHỐI LOGO GỐC CỦA BẠN */}
          <View style={styles.logoSection}>
            <View
              style={[
                styles.logoPlaceholder,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <MaterialCommunityIcons
                name="leaf"
                size={40}
                color={theme.colors.onPrimary}
              />
            </View>
            <Text
              variant="headlineSmall"
              style={[styles.title, { color: theme.colors.primary }]}
            >
              Educare Connect
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Đăng nhập để tiếp tục
            </Text>
          </View>
        </View>

        {/* ================= NỬA DƯỚI (MÀU SÁNG) ================= */}
        <View
          style={[
            styles.bottomSection,
            { backgroundColor: theme.colors.background }, // <-- TÔ MÀU NỀN DƯỚI Ở ĐÂY
          ]}
        >
          {/* GIỮ NGUYÊN KHỐI FORM GỐC CỦA BẠN */}
          <View style={styles.formSection}>
            {/* Email Input */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.inputGroup}>
                  <TextInput
                    label="Email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    left={<TextInput.Icon icon="email-outline" />}
                    error={!!errors.email}
                    disabled={isLoading}
                  />
                  <HelperText type="error" visible={!!errors.email}>
                    {errors.email?.message}
                  </HelperText>
                </View>
              )}
            />

            {/* Password Input */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.inputGroup}>
                  <TextInput
                    label="Mật khẩu"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    left={<TextInput.Icon icon="lock-outline" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                    error={!!errors.password}
                    disabled={isLoading}
                  />
                  <HelperText type="error" visible={!!errors.password}>
                    {errors.password?.message}
                  </HelperText>
                </View>
              )}
            />

            {/* Inline error banner */}
            {error && (
              <TouchableOpacity
                onPress={clearError}
                activeOpacity={0.8}
                style={[
                  styles.errorBanner,
                  { backgroundColor: theme.colors.errorContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.colors.error}
                />
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onErrorContainer,
                    flex: 1,
                    marginLeft: 8,
                    fontWeight: "600",
                  }}
                >
                  {error}
                </Text>
                <MaterialCommunityIcons
                  name="close"
                  size={16}
                  color={theme.colors.onErrorContainer}
                />
              </TouchableOpacity>
            )}

            {/* Login Button */}}
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            {/* Forgot Password Link */}
            <Button
              mode="text"
              onPress={() => {
                // TODO: Navigate to forgot password or show info
              }}
              style={styles.forgotButton}
              labelStyle={{ fontSize: 13 }}
            >
              Quên mật khẩu?
            </Button>
          </View>

          {/* Footer */}
          <Text
            variant="labelSmall"
            style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}
          >
            v1.0.0 · Educare 2026
          </Text>
        </View>
      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    // Bỏ justifyContent và padding ở đây để cấu hình riêng cho 2 mảng màu
  },

  // --- LAYOUT 2 MẢNG MÀU MỚI ---
  topSection: {
    paddingTop: 80, // Tăng khoảng trống phía trên (statusBar)
    paddingHorizontal: 24,
    paddingBottom: 20,
    justifyContent: "center",
  },
  bottomSection: {
    flex: 1, // Chiếm toàn bộ khoảng trống còn lại bên dưới
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: "space-between", // Tự đẩy Footer xuống dưới cùng
  },

  // --- GIỮ NGUYÊN TOÀN BỘ STYLE CŨ CỦA BẠN BÊN DƯỚI ---
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  formSection: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  inputGroup: {
    marginBottom: 4,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 6,
  },
  forgotButton: {
    marginTop: 8,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  footer: {
    textAlign: "center",
    marginTop: 40,
  },
});
