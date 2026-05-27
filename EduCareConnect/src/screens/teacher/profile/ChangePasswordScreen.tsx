import React from "react";
import { View, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { toast } from "@utils/toast";
import { TextInput, Button, useTheme } from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChangePassword } from "@hooks/useProfile";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "@navigation/types";

type Props = NativeStackScreenProps<
  ProfileStackParamList,
  "ChangePassword"
>;

const schema = z
  .object({
    oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function ChangePasswordScreen({ navigation }: Props) {
  const theme = useTheme();
  const changePwd = useChangePassword();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await changePwd.mutateAsync({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Đổi mật khẩu thành công");
      navigation.goBack();
    } catch {
      toast.error("Không thể đổi mật khẩu", "Vui lòng kiểm tra mật khẩu hiện tại");
    }
  });

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Controller
        control={control}
        name="oldPassword"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Mật khẩu hiện tại *"
            value={value}
            onChangeText={onChange}
            secureTextEntry
            mode="outlined"
            error={!!errors.oldPassword}
            style={styles.input}
          />
        )}
      />

      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Mật khẩu mới *"
            value={value}
            onChangeText={onChange}
            secureTextEntry
            mode="outlined"
            error={!!errors.newPassword}
            style={styles.input}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Xác nhận mật khẩu mới *"
            value={value}
            onChangeText={onChange}
            secureTextEntry
            mode="outlined"
            error={!!errors.confirmPassword}
            style={styles.input}
          />
        )}
      />

      {errors.confirmPassword && (
        <View style={{ marginBottom: 8 }}>
          {/* Error text handled by TextInput error prop */}
        </View>
      )}

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={changePwd.isPending}
        style={{ marginTop: 16 }}
      >
        Đổi mật khẩu
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { marginBottom: 16 },
});
