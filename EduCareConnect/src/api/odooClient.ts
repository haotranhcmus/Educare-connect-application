import axios, { AxiosInstance, AxiosError } from "axios";
import { getSessionId, clearSession } from "@utils/secureStore";
import { logger } from "@utils/logger";
import type {
  OdooRpcResponse,
  OdooError,
  OdooDomain,
} from "@t";

export const ODOO_BASE_URL =
  process.env.EXPO_PUBLIC_ODOO_URL || "http://educare-connect.me";
const BASE_URL = ODOO_BASE_URL;
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
  // config.data is a JS object at this stage (Axios stringifies it AFTER interceptors)
  // Do NOT call JSON.parse on it — access properties directly
  logger.api(
    "request",
    `${config.method?.toUpperCase()} ${config.url}`,
    config.data?.params,
  );
  return config;
});

// ===== Response Interceptor: xử lý Odoo errors =====
client.interceptors.response.use(
  (response) => {
    // Odoo trả error trong body JSON, không phải HTTP status
    if (response.data?.error) {
      const odooError = response.data.error as OdooError;
      const message =
        odooError.data?.message || odooError.message || "Odoo error";
      logger.error("odooClient", `Odoo RPC error: ${message}`, {
        code: odooError.code,
        name: odooError.data?.name,
        debug: odooError.data?.debug,
        url: response.config?.url,
        requestParams: response.config?.data
          ? JSON.parse(response.config.data as string)?.params
          : undefined,
      });
      const error = new Error(message) as Error & { odooError: OdooError };
      error.odooError = odooError;
      throw error;
    }
    logger.api(
      "response",
      `${response.status} ${response.config?.url}`,
      Array.isArray(response.data?.result)
        ? `${response.data.result.length} records`
        : typeof response.data?.result,
    );
    return response;
  },
  async (error: AxiosError) => {
    // Session expired → clear local data
    if (error.response?.status === 401 || error.response?.status === 403) {
      logger.warn(
        "odooClient",
        `Session expired (HTTP ${error.response.status}) — clearing local session`,
      );
      await clearSession();
      // Navigation to login will be handled by auth store listener
    } else {
      logger.error("odooClient", `Network/HTTP error`, {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        code: error.code,
      });
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
 * Generic JSON-RPC call to any Odoo controller route (`@http.route(type="json")`).
 *
 * Used for custom REST endpoints under `/api/...` declared by our own modules
 * (e.g. `educare_notification/controllers/api.py`). Goes through the same
 * interceptors (auth cookie, error normalization, logging) as `callKw`.
 *
 * @example
 *   await callJsonRoute<{ count: number }>("/api/notifications/unread-count");
 */
export async function callJsonRoute<T = unknown>(
  path: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const response = await client.post<OdooRpcResponse<T>>(path, {
    jsonrpc: "2.0",
    method: "call",
    id: nextRpcId(),
    params,
  });
  return response.data.result;
}

/**
 * Generic call_kw — gọi bất kỳ method trên bất kỳ model
 */
export async function callKw<T = unknown>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
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
  domain: OdooDomain | unknown[] = [],
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
  values: Record<string, unknown>,
): Promise<number> {
  return callKw<number>(model, "create", [values]);
}

/**
 * write shortcut
 */
export async function write(
  model: string,
  ids: number[],
  values: Record<string, unknown>,
): Promise<boolean> {
  return callKw<boolean>(model, "write", [ids, values]);
}

/**
 * search_count shortcut
 */
export async function searchCount(
  model: string,
  domain: OdooDomain | unknown[] = [],
): Promise<number> {
  return callKw<number>(model, "search_count", [domain]);
}

export { client };
