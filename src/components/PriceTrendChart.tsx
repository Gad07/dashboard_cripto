import { memo, useMemo } from "react";
import useTranslation from "../i18n";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions, TooltipItem } from "chart.js";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import type { CoinMarket, MarketChartResponse } from "../types/api";
import { formatCurrency } from "../utils/format";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend, TimeScale);

interface PriceTrendChartProps {
  data: MarketChartResponse | null;
  coin?: CoinMarket;
  vsCurrency: string;
  timeRange: number;
  loading?: boolean;
}

/**
 * Componente que renderiza el gráfico de líneas con la evolución histórica de precios.
 * - Usa `react-chartjs-2` y adapta la escala de tiempo según `timeRange`.
 * - Muestra un placeholder si no hay moneda seleccionada o los datos aún se están cargando.
 */

export const PriceTrendChart = memo(function PriceTrendChart({
  data,
  coin,
  vsCurrency,
  timeRange,
  loading = false,
}: PriceTrendChartProps) {
  const { t } = useTranslation();
  const chartDefinition = useMemo(() => {
    if (!data || !coin) {
      return null;
    }

    const styles = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
    const axisColor = styles?.getPropertyValue("--color-text-muted").trim() || "#6f6f6f";
    const gridColor = styles?.getPropertyValue("--color-border").trim() || "rgba(140, 140, 140, 0.2)";
    const legendColor = styles?.getPropertyValue("--color-text").trim() || "#1b1b1b";
    const timeUnit: "day" | "week" | "month" = timeRange <= 7 ? "day" : timeRange <= 30 ? "week" : "month";
    const chartData: ChartData<"line"> = {
      labels: data.prices.map(([timestamp]) => timestamp),
      datasets: [
        {
          label: `${coin.name} (${coin.symbol.toUpperCase()})`,
          data: data.prices.map(([, price]) => price),
          borderColor: "#ff3410",
          backgroundColor: "rgba(255, 52, 16, 0.12)",
          tension: 0.25,
          fill: true,
          pointRadius: 0,
          pointHitRadius: 16,
        },
      ],
    };

    const options: ChartOptions<"line"> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            usePointStyle: true,
            color: legendColor,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<"line">) => {
              const price = context.parsed.y ?? 0;
              return `${coin.name}: ${formatCurrency(price, vsCurrency)}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "time",
          time: {
            unit: timeUnit,
          },
          grid: {
            display: false,
          },
          ticks: {
            maxTicksLimit: timeRange <= 7 ? 8 : 10,
            color: axisColor,
          },
        },
        y: {
          grid: {
            color: gridColor,
          },
          ticks: {
            callback: (value) => {
              if (typeof value !== "number") return value.toString();
              return formatCurrency(value, vsCurrency);
            },
            maxTicksLimit: 6,
            color: axisColor,
          },
        },
      },
    };

    return { data: chartData, options };
  }, [coin, data, timeRange, vsCurrency]);

  return (
    <section className="chart-card" aria-live="polite">
      <header className="chart-header">
        <div>
          <h2>{t("priceTrendTitle")}</h2>
          <p>
            {t("priceTrendDesc", { name: coin?.name ?? t("selectCoinPlaceholder"), days: timeRange } as any)}
          </p>
        </div>
        {loading && <span className="progress-indicator" aria-label={t("loadingTrend")} />}
      </header>

      <div className="chart-container" role="img" aria-label="Grafico de lineas con la evolucion del precio">
        {chartDefinition && !loading ? (
          <Line data={chartDefinition.data} options={chartDefinition.options} />
        ) : (
          <div className="chart-placeholder" aria-busy={loading} aria-live="polite">
            {loading ? t("loadingTrendData") : t("selectCoinToViewTrend")}
          </div>
        )}
      </div>
    </section>
  );
});
