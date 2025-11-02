/**
 * Tipos principales de la API usados en la aplicación.
 *
 * Estos tipos representan la forma de los objetos que devolvemos desde
 * CoinGecko y que consumen los componentes del dashboard.
 */
export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number | null;
}

/**
 * Respuesta simplificada del endpoint `coins/{id}/market_chart` de CoinGecko.
 * - `prices`, `market_caps` y `total_volumes` son arrays de pares [timestamp, valor].
 */
export interface MarketChartResponse {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

/**
 * Filtros usados por el hook `useCoinDashboard` y la UI.
 * - `vsCurrency`: moneda de referencia para precios (ej. "usd").
 * - `timeRange`: número de días para consultar series temporales.
 * - `selectedCoins`: lista de ids de monedas seleccionadas por el usuario.
 * - `primaryCoin`: id de la moneda principal para el gráfico de tendencia.
 */
export interface DashboardFilters {
  vsCurrency: string;
  timeRange: number;
  selectedCoins: string[];
  primaryCoin: string;
}
