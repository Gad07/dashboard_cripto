// Type declarations for Vite's import.meta.env variables used in this project.
// Add any new VITE_ variables here to avoid TypeScript errors.
interface ImportMetaEnv {
  /**
   * API key privada de CoinGecko (opcional).
   * Ejemplo en .env: VITE_COINGECKO_API_KEY=CG-xxxxxxxx
   */
  readonly VITE_COINGECKO_API_KEY?: string;

  /**
   * Root alternativo para la API (útil si usas un proxy en desarrollo).
   * Ejemplo: https://mi-proxy.local
   */
  readonly VITE_COINGECKO_API_ROOT?: string;

  /**
   * Forzar uso del endpoint PRO de CoinGecko. Valor: "true" | "false"
   */
  readonly VITE_COINGECKO_USE_PRO_API?: string;

  /**
   * Intervalo de auto-refresh en ms como string. Ej: "30000"
   */
  readonly VITE_AUTO_REFRESH_MS?: string;

  // Permitir otras variables arbitrarias que empiecen por VITE_
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
