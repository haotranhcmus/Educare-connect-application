import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEYS = {
  SESSION_ID: "session_id",
  UID: "uid",
  ROLE: "role",
  USER_NAME: "user_name",
  CENTER_NAME: "center_name",
  CENTER_ID: "center_id",
} as const;

// expo-secure-store không hỗ trợ web — fallback sang localStorage
const isWeb = Platform.OS === "web";

async function setItem(key: string, value: string): Promise<void> {
  // Guard: SecureStore yêu cầu giá trị phải là string không rỗng
  const safeValue = value != null ? String(value) : "";
  if (!safeValue) return; // không lưu giá trị rỗng
  if (isWeb) {
    localStorage.setItem(key, safeValue);
  } else {
    await SecureStore.setItemAsync(key, safeValue);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveSession(data: {
  sessionId: string;
  uid: number;
  role: string;
  userName: string;
  centerName?: string;
  centerId?: number;
}): Promise<void> {
  await setItem(KEYS.SESSION_ID, data.sessionId);
  await setItem(KEYS.UID, String(data.uid));
  await setItem(KEYS.ROLE, data.role);
  await setItem(KEYS.USER_NAME, data.userName);
  if (data.centerName) {
    await setItem(KEYS.CENTER_NAME, data.centerName);
  }
  if (data.centerId) {
    await setItem(KEYS.CENTER_ID, String(data.centerId));
  }
}

export async function getSessionId(): Promise<string | null> {
  return getItem(KEYS.SESSION_ID);
}

export async function getUid(): Promise<number | null> {
  const uid = await getItem(KEYS.UID);
  return uid ? parseInt(uid, 10) : null;
}

export async function getRole(): Promise<string | null> {
  return getItem(KEYS.ROLE);
}

export async function getUserName(): Promise<string | null> {
  return getItem(KEYS.USER_NAME);
}

export async function getCenterName(): Promise<string | null> {
  return getItem(KEYS.CENTER_NAME);
}

export async function clearSession(): Promise<void> {
  await Promise.all(Object.values(KEYS).map((key) => removeItem(key)));
}
