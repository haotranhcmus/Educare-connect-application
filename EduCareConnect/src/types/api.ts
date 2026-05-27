/** Generic Odoo JSON-RPC response wrapper */
export interface OdooRpcResponse<T> {
  jsonrpc: "2.0";
  id: number | null;
  result: T;
}

/** Odoo search_read result */
export interface OdooSearchReadResult<T> {
  records: T[];
  length: number;
}

/** Odoo authentication response */
export interface OdooAuthResponse {
  uid: number | false;
  session_id: string;
  user_context: Record<string, unknown>;
  partner_id?: number;
  name?: string;
  username?: string;
}

/** API error from Odoo */
export interface OdooError {
  code: number;
  message: string;
  data: {
    name: string;
    debug: string;
    message: string;
    arguments: string[];
  };
}

/** Common paginated list params */
export interface ListParams {
  offset?: number;
  limit?: number;
  order?: string;
  domain?: OdooDomain;
}

/**
 * Odoo search domain. Tuple `[field, operator, value]` or logical operator
 * literals like `"&"`, `"|"`, `"!"`. We allow mixed entries via union since
 * Odoo accepts heterogeneous arrays.
 */
export type OdooDomainOperator = "&" | "|" | "!";
export type OdooDomainLeaf = readonly [string, string, unknown];
export type OdooDomainNode = OdooDomainLeaf | OdooDomainOperator;
export type OdooDomain = ReadonlyArray<OdooDomainNode>;

/** Mutable form for builders that push leaves incrementally. */
export type OdooMutableDomain = OdooDomainNode[];
