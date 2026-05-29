import React, { useState } from "react";
import { Portal, Dialog, Button, Text, useTheme } from "react-native-paper";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { useOfflineModalStore } from "@store/offlineModalStore";

/**
 * Single mounted Dialog at app root. Shows when any guarded action is
 * attempted while offline. The Retry button rechecks NetInfo and, if
 * connected, pushes the new state into react-query's onlineManager and
 * closes the modal so subsequent taps go through.
 */
export function OfflineModal() {
  const theme = useTheme();
  const visible = useOfflineModalStore((s) => s.visible);
  const hide = useOfflineModalStore((s) => s.hide);
  const [checking, setChecking] = useState(false);

  const handleRetry = async () => {
    setChecking(true);
    try {
      const state = await NetInfo.fetch();
      const online = !!state.isConnected;
      onlineManager.setOnline(online);
      if (online) hide();
    } finally {
      setChecking(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={hide}>
        <Dialog.Icon icon="wifi-off" />
        <Dialog.Title style={{ textAlign: "center" }}>
          Không có kết nối mạng
        </Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            Hành động này cần kết nối Internet. Vui lòng bật Wi-Fi hoặc dữ
            liệu di động rồi thử lại.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={hide} disabled={checking}>
            Đóng
          </Button>
          <Button mode="contained" loading={checking} onPress={handleRetry}>
            Thử lại
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
