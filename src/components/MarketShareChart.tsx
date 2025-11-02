import { memo, useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import type { TooltipItem } from "chart.js";
import useTranslation from "../i18n";
import type { CoinMarket } from "../types/api";
import { formatCurrency, formatShare } from "../utils/format";

Chart.register(ArcElement, Tooltip, Legend);

interface MarketShareChartProps {
  coins: CoinMarket[];
  vsCurrency: string;
  loading?: boolean;
}

const palette = ["#ff3410", "#bbbbbb", "#8f8f8f", "#d6d6d6", "#6a6a6a", "#c2c2c2", "#4a4a4a", "#a0a0a0"];

/**
 * MarketShareChart
 *
 * Gráfico circular que compara la participación por capitalización de las monedas seleccionadas.
 * - Muestra tooltip con capitalización y porcentaje del total.
 * - Acepta `loading` para mostrar un indicador de carga.
 */
export const MarketShareChart = memo(function MarketShareChart({
  coins,
  vsCurrency,
  loading = false,
}: MarketShareChartProps) {
  const { t } = useTranslation();
  const chartDefinition = useMemo(() => {
    if (coins.length === 0) {
      return null;
    }

    const totalMarketCap = coins.reduce((acc, coin) => acc + (coin.market_cap ?? 0), 0);
    const styles = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
    const legendColor = styles?.getPropertyValue("--color-text").trim() || "#1b1b1b";
    const data = {
      labels: coins.map((coin) => coin.name),
      datasets: [
        {
          label: t("marketShareTitle"),
          data: coins.map((coin) => coin.market_cap ?? 0),
          backgroundColor: coins.map((_, index) => palette[index % palette.length]),
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right" as const,
          labels: {
            usePointStyle: true,
            color: legendColor,
          },
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<"doughnut">) => {
              const marketCap = context.parsed ?? 0;
              const share = marketCap / totalMarketCap;
              const coinName = context.label;
              return `${coinName}: ${formatCurrency(marketCap, vsCurrency)} (${formatShare(share)})`;
            },
          },
        },
      },
    };

    return { data, options };
  }, [coins, vsCurrency]);

  return (
    <section className="chart-card" aria-live="polite">
      <header className="chart-header">
        <div>
          <h2>{t("marketShareTitle")}</h2>
          <p>{t("marketShareDesc")}</p>
        </div>
        {loading && <span className="progress-indicator" aria-label={t("loadingMarketShare")} />}
      </header>

      <div className="chart-container" role="img" aria-label={t("marketShareChartAria")}>
        {chartDefinition && !loading ? (
          <Doughnut data={chartDefinition.data} options={chartDefinition.options} />
        ) : (
          <div className="chart-placeholder" aria-busy={loading}>
            {loading ? t("loadingMarketShare") : t("selectAtLeastOneToCompare")}
          </div>
        )}
      </div>
    </section>
  );
});
