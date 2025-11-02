import type { CoinMarket, MarketChartResponse } from "../types/api";

/**
 * Módulo que encapsula las llamadas a la API de CoinGecko.
 *
 * Uso:
 * - Durante desarrollo, las peticiones se proxyean a través de Vite en `/api/coingecko` para
 *   evitar problemas de CORS. En producción se usa la URL pública o la pro según configuración.
 * - Configuración sensible (API key) se lee desde variables Vite (`import.meta.env.VITE_*`).
 *
 * Funciones exportadas:
 * - `getTopMarkets(vsCurrency, perPage)`: obtiene listado de mercados ordenado por capitalización.
 * - `getMarketChart(coinId, vsCurrency, days)`: obtiene series temporales para una moneda.
 */
// Read sensitive configuration from Vite env vars (set these in your local .env file):
// VITE_COINGECKO_API_KEY, VITE_COINGECKO_API_ROOT, VITE_COINGECKO_USE_PRO_API
// Note: do NOT commit your real API key to the repo. Use `.env` and keep `.env` in .gitignore.
const ENV_API_KEY = (import.meta.env.VITE_COINGECKO_API_KEY as string) || undefined;
const ENV_API_ROOT = (import.meta.env.VITE_COINGECKO_API_ROOT as string) || undefined;
const ENV_USE_PRO = (import.meta.env.VITE_COINGECKO_USE_PRO_API as string) === "true";

// Decide which API base to use:
// - If VITE_COINGECKO_API_ROOT is set, use it (useful for proxies).
// - Else if VITE_COINGECKO_USE_PRO_API is "true", use the pro endpoint (requires key).
// - Else if an API key is provided, prefer the pro endpoint (assume it's a paid key).
// - Otherwise fall back to the public CoinGecko API.
const API_KEY = ENV_API_KEY ?? undefined;

// During local development, use the Vite proxy to avoid CORS issues (proxied at /api/coingecko).
const API_BASE =
  ENV_API_ROOT ??
  (import.meta.env.DEV
    ? "/api/coingecko"
    : ENV_USE_PRO
    ? "https://pro-api.coingecko.com/api/v3"
    : API_KEY
    ? "https://pro-api.coingecko.com/api/v3"
    : "https://api.coingecko.com/api/v3");

const defaultHeaders: Record<string, string> = {
  Accept: "application/json",
};

// Only send the pro API key header when using the pro endpoint and a key is present.
if (API_KEY && API_BASE.includes("pro-api")) {
  defaultHeaders["x-cg-pro-api-key"] = API_KEY;
}

async function request<T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {},
  signal?: AbortSignal,
): Promise<T> {
  // `API_BASE` may be a relative path during development (proxy like `/api/coingecko`).
  // `new URL(...)` requires an absolute URL, so build the request URL accordingly.
  let urlString: string;
  if (/^https?:\/\//i.test(String(API_BASE))) {
    const url = new URL(`${API_BASE.replace(/\/$/, "")}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
    urlString = url.toString();
  } else {
    // Relative base (dev proxy) — construct path + query string manually
    const base = String(API_BASE).replace(/\/$/, "");
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => query.set(key, String(value)));
    urlString = `${base}/${endpoint}${query.toString() ? `?${query.toString()}` : ""}`;
  }

  const response = await fetch(urlString, {
    headers: defaultHeaders,
    signal,
  });

  // Handle rate-limiting (429) specially so callers can implement backoff/retry UI.
  if (response.status === 429) {
    const retryHeader = response.headers.get("Retry-After");
    const retryAfter = retryHeader ? Number(retryHeader) : undefined;
    class RateLimitError extends Error {
      retryAfter?: number;
      status = 429;
      constructor(message: string, retryAfter?: number) {
        super(message);
        this.name = "RateLimitError";
        this.retryAfter = retryAfter;
      }
    }
    throw new RateLimitError("Rate limit exceeded", retryAfter);
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `CoinGecko request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Export RateLimitError type for callers to detect rate-limited responses.
export class RateLimitError extends Error {
  retryAfter?: number;
  status = 429;
  constructor(message = "Rate limit exceeded", retryAfter?: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Obtiene el top de mercados (coins/markets) desde CoinGecko.
 * @param vsCurrency - Moneda de referencia (ej. "usd").
 * @param perPage - Número máximo de resultados por página.
 * @param signal - AbortSignal opcional para cancelar la petición.
 * @returns Promise con un array de `CoinMarket`.
 */
export async function getTopMarkets(vsCurrency: string, perPage = 50, signal?: AbortSignal): Promise<CoinMarket[]> {
  return request<CoinMarket[]>(
    "coins/markets",
    {
      vs_currency: vsCurrency,
      order: "market_cap_desc",
      per_page: perPage,
      page: 1,
      sparkline: false,
      price_change_percentage: "24h",
    },
    signal,
  );
}

/**
 * Obtiene datos de mercado históricos para un coin (market_chart).
 * @param coinId - Identificador de la moneda (ej. "bitcoin").
 * @param vsCurrency - Moneda de referencia.
 * @param days - Rango en días para la serie temporal.
 * @param signal - AbortSignal opcional.
 */
export async function getMarketChart(
  coinId: string,
  vsCurrency: string,
  days: number,
  signal?: AbortSignal,
): Promise<MarketChartResponse> {
  return request<MarketChartResponse>(
    `coins/${coinId}/market_chart`,
    {
      vs_currency: vsCurrency,
      days,
      precision: 2,
    },
    signal,
  );
}

// Note: explicitly setting `interval=hourly` can trigger an "Enterprise plan" error
// from CoinGecko for some API keys/plans. The CoinGecko API returns appropriate
// granularity automatically for most `days` values (hourly for 2-90 days, daily for
// longer ranges), so we avoid sending the `interval` parameter to be compatible
// with demo/public keys and to prevent the 10005 error.
