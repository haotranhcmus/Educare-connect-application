import { create } from "zustand";
import type { UserRole } from "../types";
import {
  saveSession,
  getSessionId,
  getUid,
  getRole,
  getUserName,
  getCenterName,
  clearSession as clearSecureStore,
} from "../utils/secureStore";
import {
  authenticate,
  getSessionInfo,
  setActiveSession,
} from "../api/odooClient";
import { fetchUserProfile } from "../api/authApi";

interface AuthState {
  // State
  uid: number | null;
  sessionId: string | null;
  role: UserRole | null;
  userName: string | null;
  centerName: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  uid: null,
  sessionId: null,
  role: null,
  userName: null,
  centerName: null,
  isLoading: true, // true initially — show SplashScreen while checkSession runs on startup
  isAuthenticated: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const authResult = await authenticate(email, password);

      if (!authResult?.uid || authResult.uid === false) {
        set({ isLoading: false, error: "Email hoặc mật khẩu không đúng" });
        return;
      }

      // Gắn session vào memory để interceptor gửi cookie trong fetchUserProfile
      // (SecureStore chưa có session_id này vì saveSession() chưa được gọi)
      setActiveSession(authResult.session_id);

      let profile;
      try {
        profile = await fetchUserProfile(authResult.uid);
      } finally {
        setActiveSession(null); // xóa memory session sau khi lấy profile xong
      }

      const role = profile.role as UserRole;
      if (role !== "teacher" && role !== "parent") {
        set({
          isLoading: false,
          error: "Tài khoản không có quyền truy cập app mobile",
        });
        return;
      }

      // center_id là Many2one: [id, name] hoặc false
      const centerEntry = profile.center_id;
      const centerName = centerEntry ? String(centerEntry[1]) : "";
      const centerId = centerEntry ? centerEntry[0] : undefined;
      // Odoo trả false cho các field không có giá trị — normalize về string
      const userName = authResult.name ? String(authResult.name) : "";

      await saveSession({
        sessionId: String(authResult.session_id),
        uid: authResult.uid,
        role,
        userName,
        centerName,
        centerId,
      });

      set({
        uid: authResult.uid,
        sessionId: authResult.session_id,
        role,
        userName,
        centerName,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || "Lỗi kết nối. Vui lòng thử lại.",
      });
    }
  },

  logout: async () => {
    await clearSecureStore();
    set({
      uid: null,
      sessionId: null,
      role: null,
      userName: null,
      centerName: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const sessionId = await getSessionId();
      if (!sessionId) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Validate session with Odoo — timeout after 5s to avoid long splash screen
      const sessionInfoPromise = getSessionInfo();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Session check timeout")), 5000),
      );
      const sessionInfo = await Promise.race([
        sessionInfoPromise,
        timeoutPromise,
      ]);

      if (!sessionInfo.uid || sessionInfo.uid === false) {
        await clearSecureStore();
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const role = (await getRole()) as UserRole;
      const userName = await getUserName();
      const centerName = await getCenterName();

      set({
        uid: sessionInfo.uid,
        sessionId,
        role,
        userName,
        centerName,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Network error or session expired — always ensure isLoading is cleared
      try {
        await clearSecureStore();
      } catch {
        // ignore SecureStore errors
      }
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
