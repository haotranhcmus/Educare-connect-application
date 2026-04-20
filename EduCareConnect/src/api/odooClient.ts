import axios, { AxiosInstance, AxiosError } from "axios";
import { getSessionId, clearSession } from "../utils/secureStore";
import type {
  OdooRpcResponse,
  OdooSearchReadResult,
  OdooError,
} from "../types";

const BASE_URL =
  process.env.EXPO_PUBLIC_ODOO_URL || "http://educare-connect.me";
const DB_NAME = process.env.EXPO_PUBLIC_ODOO_DB || "educare";

let rpcId = 0;

function nextRpcId(): number {
  rpcId += 1;
  return rpcId;
}

// Giữ session_id trong memory trong khi login (trước khi lưu vào SecureStore)
let _activeSessionId: string | null = null;

/**
 * Gọi trước API đầu tiên sau authenticate() để interceptor có cookie.
 * Gọi lại với null sau khi đã saveSession().
 */
export function setActiveSession(sessionId: string | null): void {
  _activeSessionId = sessionId;
}

/**
 * Axios instance cấu hình cho Odoo JSON-RPC
 */
const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// ===== Request Interceptor: gắn session cookie =====
client.interceptors.request.use(async (config) => {
  // Ưu tiên in-memory session (trong login flow), fallback về SecureStore
  const sessionId = _activeSessionId ?? (await getSessionId());
  if (sessionId) {
    config.headers.Cookie = `session_id=${sessionId}`;
  }
  return config;
});

// ===== Response Interceptor: xử lý Odoo errors =====
client.interceptors.response.use(
  (response) => {
    // Odoo trả error trong body JSON, không phải HTTP status
    if (response.data?.error) {
      const odooError = response.data.error as OdooError;
      const error = new Error(
        odooError.data?.message || odooError.message || "Odoo error",
      );
      (error as any).odooError = odooError;
      throw error;
    }
    return response;
  },
  async (error: AxiosError) => {
    // Session expired → clear local data
    if (error.response?.status === 401 || error.response?.status === 403) {
      await clearSession();
      // Navigation to login will be handled by auth store listener
    }
    throw error;
  },
);

// ===== Core API Functions =====

/**
 * Authenticate with Odoo
 */
export async function authenticate(login: string, password: string) {
  const response = await client.post("/web/session/authenticate", {
    jsonrpc: "2.0",
    method: "call",
    id: nextRpcId(),
    params: {
      db: DB_NAME,
      login,
      password,
    },
  });
  return response.data.result;
}

/**
 * Check if current session is still valid
 */
export async function getSessionInfo() {
  const response = await client.post("/web/session/get_session_info", {
    jsonrpc: "2.0",
    method: "call",
    id: nextRpcId(),
    params: {},
  });
  return response.data.result;
}

/**
 * Generic call_kw — gọi bất kỳ method trên bất kỳ model
 */
export async function callKw<T = any>(
  model: string,
  method: string,
  args: any[] = [],
  kwargs: Record<string, any> = {},
): Promise<T> {
  const response = await client.post<OdooRpcResponse<T>>(
    "/web/dataset/call_kw",
    {
      jsonrpc: "2.0",
      method: "call",
      id: nextRpcId(),
      params: {
        model,
        method,
        args,
        kwargs,
      },
    },
  );
  return response.data.result;
}

/**
 * search_read shortcut — dùng nhiều nhất
 *
 * @example
 * const students = await searchRead<StudentListItem>(
 *   'educare.student',
 *   [['status', '=', 'active']],
 *   ['id', 'name', 'student_code', 'status'],
 *   { limit: 20, order: 'name asc' }
 * );
 */
export async function searchRead<T>(
  model: string,
  domain: any[] = [],
  fields: string[] = [],
  options: {
    limit?: number;
    offset?: number;
    order?: string;
  } = {},
): Promise<T[]> {
  const result = await callKw<T[]>(model, "search_read", [domain], {
    fields,
    limit: options.limit ?? 80,
    offset: options.offset ?? 0,
    order: options.order ?? "",
  });
  return result;
}

/**
 * read shortcut — đọc records theo ids
 */
export async function read<T>(
  model: string,
  ids: number[],
  fields: string[] = [],
): Promise<T[]> {
  return callKw<T[]>(model, "read", [ids], { fields });
}

/**
 * create shortcut
 */
export async function create(
  model: string,
  values: Record<string, any>,
): Promise<number> {
  return callKw<number>(model, "create", [values]);
}

/**
 * write shortcut
 */
export async function write(
  model: string,
  ids: number[],
  values: Record<string, any>,
): Promise<boolean> {
  return callKw<boolean>(model, "write", [ids, values]);
}

/**
 * search_count shortcut
 */
export async function searchCount(
  model: string,
  domain: any[] = [],
): Promise<number> {
  return callKw<number>(model, "search_count", [domain]);
}

export { client };
