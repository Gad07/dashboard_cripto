/**
 * App.tsx - Main application shell
 * - Wires `useCoinDashboard` state to layout
 * - Renders the `Navbar`, filters, charts and tables
 * - Uses the lightweight i18n hook at `src/i18n` for translations (EN/ES)
 *
 * Notes:
 * - Keep this component lean: business logic should live in hooks (see `useCoinDashboard`).
 */
/**
 * Componente raíz de la aplicación.
 * - Conecta el hook `useCoinDashboard` al layout principal.
 * - Renderiza la barra de navegación, panel de filtros, visualizaciones y tabla.
 *
 * Los textos se traducen mediante el hook `useTranslation`.
 */
import "./App.css";
import { Navbar } from "./components/Navbar";
import useTranslation from "./i18n";
import { PrimaryCoinCard } from "./components/PrimaryCoinCard";
import { FilterPanel } from "./components/FilterPanel";
import { PriceTrendChart } from "./components/PriceTrendChart";
import { MarketShareChart } from "./components/MarketShareChart";
import { CoinTable } from "./components/CoinTable";
import { useCoinDashboard } from "./hooks/useCoinDashboard";
// PrimaryCoinCard removed from the main layout per user request

function App() {
  const { t } = useTranslation();
  const {
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
  } = useCoinDashboard();

  const primaryCoin = availableCoins.find((coin) => coin.id === filters.primaryCoin);
  const primaryCoinMarket =
    selectedCoinMarkets.find((coin) => coin.id === filters.primaryCoin) ?? primaryCoin ?? null;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#dashboard-main">
        {t("skipToContent")}
      </a>
      <div className="dashboard-container">
  <Navbar lastUpdated={lastUpdated} />
        <main id="dashboard-main" className="dashboard-main" tabIndex={-1}>
          {error ? (
            <div className="alert" role="alert">
              <div>
                <strong>{t("errorTitle")}</strong>
                <p>{error}</p>
              </div>
              <button type="button" onClick={refreshData} className="refresh-button">
                {t("retry")}
              </button>
            </div>
          ) : null}

          <div className="dashboard-layout">
              <aside className="dashboard-sidebar" aria-label={t("sidebarLabel")}>
              <FilterPanel
                filters={filters}
                availableCoins={availableCoins}
                onFiltersChange={setFilters}
                disabled={loadingMarkets}
              />
            </aside>

            <section className="dashboard-content">
              <section className="charts-grid" aria-label={t("visualizations")}>
                <PriceTrendChart
                  data={chartData}
                  coin={primaryCoinMarket ?? primaryCoin ?? undefined}
                  vsCurrency={filters.vsCurrency}
                  timeRange={filters.timeRange}
                  loading={loadingChart}
                />
                <MarketShareChart
                  coins={selectedCoinMarkets}
                  vsCurrency={filters.vsCurrency}
                  loading={loadingMarkets}
                />
              </section>

              <PrimaryCoinCard
                coin={primaryCoinMarket ?? undefined}
                vsCurrency={filters.vsCurrency}
                loading={loadingMarkets}
                onRefresh={refreshData}
              />
              <CoinTable coins={selectedCoinMarkets} vsCurrency={filters.vsCurrency} />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
