/**
 * Hook central que maneja el estado del dashboard de monedas.
 *
 * Funcionalidad principal:
 * - Solicita el listado de mercados y los datos de series temporales (chart) desde CoinGecko.
 * - Mantiene filtros, selección de monedas, estados de carga y errores.
 * - Soporta refresco automático (polling) controlado por la variable de entorno
 *   VITE_AUTO_REFRESH_MS (milisegundos). Si <= 0, el polling está desactivado.
 * - Implementa backoff exponencial, jitter y pausa cuando la pestaña está en background
 *   para mitigar rate limits.
 *
 * Devuelve un objeto con el estado y funciones para actualizar filtros y forzar refresco.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CoinMarket, DashboardFilters, MarketChartResponse } from "../types/api";
import { getMarketChart, getTopMarkets, RateLimitError } from "../services/coingecko";
import useTranslation from "../i18n";
import { areArraysEqual } from "../utils/array";
const DEFAULT_FILTERS: DashboardFilters = {
  vsCurrency: "usd",
  timeRange: 30,
  selectedCoins: [],
  primaryCoin: "",
};

interface DashboardState {
  filters: DashboardFilters;
  availableCoins: CoinMarket[];
  selectedCoinMarkets: CoinMarket[];
  chartData: MarketChartResponse | null;
  loadingMarkets: boolean;
  loadingChart: boolean;
  error: string | null;
  setFilters: (updater: (filters: DashboardFilters) => DashboardFilters) => void;
  refreshData: () => void;
  lastUpdated: Date | null;
}

/**
 * useCoinDashboard
 * @returns Estado completo del dashboard y utilidades para interactuar con él.
 * - `filters`: filtros actuales (moneda, rango, selección)
 * - `availableCoins`: listado de monedas consultadas
 * - `selectedCoinMarkets`: mercados filtrados seleccionados
 * - `chartData`: datos para el gráfico de la moneda primaria
 * - `refreshData()`: fuerza la recarga de markets y chart
 */
export function useCoinDashboard(): DashboardState {
  const [filters, setFiltersState] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [availableCoins, setAvailableCoins] = useState<CoinMarket[]>([]);
  const [selectedCoinMarkets, setSelectedCoinMarkets] = useState<CoinMarket[]>([]);
  const [chartData, setChartData] = useState<MarketChartResponse | null>(null);
  const [loadingMarkets, setLoadingMarkets] = useState<boolean>(false);
  const [loadingChart, setLoadingChart] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { t } = useTranslation();
  // Auto-refresh interval in milliseconds. Set via Vite env var VITE_AUTO_REFRESH_MS.
  // If not set or set to 0, polling is disabled.
  const AUTO_REFRESH_MS = Number((import.meta.env.VITE_AUTO_REFRESH_MS as string) ?? 0) || 0;

  const setFilters = useCallback(
    (updater: (filters: DashboardFilters) => DashboardFilters) => {
      setFiltersState((prev) => {
        const next = updater(prev);
        // do not force a default selection — allow empty selectedCoins and empty primaryCoin
        return {
          ...next,
        };
      });
    },
    [],
  );

  const loadMarketOverview = useCallback(
    async (signal: AbortSignal | null) => {
      setLoadingMarkets(true);
      try {
        const data = await getTopMarkets(filters.vsCurrency, 50, signal ?? undefined);
        if (signal?.aborted) return;

        setAvailableCoins(data);

        const filtered = filters.selectedCoins.filter((coinId) => data.some((coin) => coin.id === coinId));
        // Keep filtered as-is; allow empty selection (no default coins)
        const fallbackSelected = filtered;
        const nextPrimary = filtered.includes(filters.primaryCoin) ? filters.primaryCoin : filtered[0] ?? "";

        if (!areArraysEqual(fallbackSelected, filters.selectedCoins) || nextPrimary !== filters.primaryCoin) {
          setFiltersState((prev) => ({
            ...prev,
            selectedCoins: fallbackSelected,
            primaryCoin: nextPrimary,
          }));
        }

        setSelectedCoinMarkets(
          fallbackSelected
            .map((coinId) => data.find((coin) => coin.id === coinId))
            .filter((coin): coin is CoinMarket => Boolean(coin)),
        );
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        if (signal?.aborted) return;
        // Rate limit handling
        if (err instanceof RateLimitError) {
          const retry = typeof err.retryAfter === "number" && err.retryAfter > 0 ? Math.round(err.retryAfter) : null;
          if (retry) {
            setError(t("rateLimitMessage", { n: retry } as any));
          } else {
            setError(t("rateLimitRetryLater"));
          }
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
            setError("No se pudo conectar con CoinGecko. Revisa tu conexión o intenta de nuevo.");
          } else {
            setError(msg || "Unexpected error while loading market data.");
          }
        }
      } finally {
        if (!signal?.aborted) {
          setLoadingMarkets(false);
        }
      }
    },
    [filters.primaryCoin, filters.selectedCoins, filters.vsCurrency],
  );

  const loadChart = useCallback(
    async (signal: AbortSignal | null) => {
      setLoadingChart(true);
      try {
        const data = await getMarketChart(filters.primaryCoin, filters.vsCurrency, filters.timeRange, signal ?? undefined);
        if (signal?.aborted) return;
        setChartData(data);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        if (signal?.aborted) return;
        if (err instanceof RateLimitError) {
          const retry = typeof err.retryAfter === "number" && err.retryAfter > 0 ? Math.round(err.retryAfter) : null;
          if (retry) {
            setError(t("rateLimitMessage", { n: retry } as any));
          } else {
            setError(t("rateLimitRetryLater"));
          }
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
            setError("No se pudo conectar con CoinGecko. Revisa tu conexión o intenta de nuevo.");
          } else {
            setError(msg || "Unexpected error while loading chart data.");
          }
        }
      } finally {
        if (!signal?.aborted) {
          setLoadingChart(false);
        }
      }
    },
    [filters.primaryCoin, filters.timeRange, filters.vsCurrency],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadMarketOverview(controller.signal).catch(() => {
      // errors handled inside loader
    });
    return () => controller.abort();
  }, [loadMarketOverview]);

  useEffect(() => {
    if (!filters.primaryCoin) return;
    const controller = new AbortController();
    loadChart(controller.signal).catch(() => {
      // errors handled inside loader
    });
    return () => controller.abort();
  }, [filters.primaryCoin, filters.timeRange, filters.vsCurrency, loadChart]);

  // Polling (auto-refresh) effect with exponential backoff, jitter and visibility pause.
  // This avoids making many continuous calls that trigger CoinGecko rate limits.
  useEffect(() => {
    if (!AUTO_REFRESH_MS || AUTO_REFRESH_MS <= 0) return;

    const isFetchingRef = { current: false } as { current: boolean };
    const failureCountRef = { current: 0 } as { current: number };
    let cancelled = false;
    let timeoutId: number | undefined;

    const scheduleNext = () => {
      // Backoff multiplier: 2^failures, capped at 8x
      const multiplier = Math.min(2 ** failureCountRef.current, 8);
      let next = AUTO_REFRESH_MS * multiplier;

      // If page is hidden, increase the wait time to reduce background traffic
      if (typeof document !== "undefined" && document.hidden) {
        next = Math.max(next, AUTO_REFRESH_MS * 6);
      }

      // Add jitter +/-10%
      const jitter = Math.round(next * (Math.random() * 0.2 - 0.1));
      next = Math.max(1000, next + jitter);

      timeoutId = window.setTimeout(attemptFetch, next) as unknown as number;
    };

    const attemptFetch = async () => {
      if (cancelled) return;
      if (isFetchingRef.current) return scheduleNext();
      if (typeof document !== "undefined" && document.hidden) return scheduleNext();

      isFetchingRef.current = true;
      const controller = new AbortController();
      try {
        await Promise.all([loadMarketOverview(controller.signal), loadChart(controller.signal)]);
        // success: reset failure count
        failureCountRef.current = 0;
      } catch (err) {
        // On error (network, rate limit, etc.) increase failure count to back off
        failureCountRef.current = Math.min(failureCountRef.current + 1, 6);
      } finally {
        controller.abort();
        isFetchingRef.current = false;
        if (!cancelled) scheduleNext();
      }
    };

    // Start immediately
    attemptFetch().catch(() => {});

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [AUTO_REFRESH_MS, loadMarketOverview, loadChart]);

  const refreshData = useCallback(() => {
    const controller = new AbortController();
    loadMarketOverview(controller.signal).catch(() => {});
    loadChart(controller.signal).catch(() => {});
  }, [loadChart, loadMarketOverview]);

  const value = useMemo<DashboardState>(
    () => ({
      filters,
      availableCoins,
      selectedCoinMarkets,
      chartData,
      loadingMarkets,
      loadingChart,
      error,
      setFilters,
      refreshData,
      lastUpdated,
    }),
    [
      filters,
      availableCoins,
      selectedCoinMarkets,
      chartData,
      loadingMarkets,
      loadingChart,
      error,
      setFilters,
      refreshData,
      lastUpdated,
    ],
  );

  return value;
}
