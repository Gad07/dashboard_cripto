import { memo, useMemo } from "react";
import type { CoinMarket } from "../types/api";
import { formatCurrency, formatPercentage } from "../utils/format";

/**
 * InsightsBanner
 *
 * Genera tarjetas resumen con insights automáticos a partir del conjunto de monedas:
 * - Mayor alza / mayor retroceso en 24h
 * - Activo con mayor capitalización dentro del grupo
 *
 * Este componente es puramente informativo y no modifica el estado global.
 */

interface InsightsBannerProps {
  coins: CoinMarket[];
  vsCurrency: string;
}

interface InsightItem {
  id: string;
  title: string;
  metric: string;
  detail: string;
  variant: "positive" | "negative" | "neutral";
  badge?: string;
}

export const InsightsBanner = memo(function InsightsBanner({ coins, vsCurrency }: InsightsBannerProps) {
  const insights = useMemo<InsightItem[]>(() => {
    if (coins.length === 0) {
      return [];
    }

    const changeCandidates = coins.filter(
      (coin) => coin.price_change_percentage_24h !== null && coin.price_change_percentage_24h !== undefined,
    );

    const bestPerformer =
      changeCandidates.length > 0
        ? changeCandidates.reduce((prev, current) =>
            (current.price_change_percentage_24h ?? Number.NEGATIVE_INFINITY) >
            (prev.price_change_percentage_24h ?? Number.NEGATIVE_INFINITY)
              ? current
              : prev,
          )
        : null;

    const worstPerformer =
      changeCandidates.length > 0
        ? changeCandidates.reduce((prev, current) =>
            (current.price_change_percentage_24h ?? Number.POSITIVE_INFINITY) <
            (prev.price_change_percentage_24h ?? Number.POSITIVE_INFINITY)
              ? current
              : prev,
          )
        : null;

    const totalMarketCap = coins.reduce((acc, coin) => acc + (coin.market_cap ?? 0), 0);
    const dominantCap =
      coins.length > 0
        ? coins.reduce((prev, current) => ((current.market_cap ?? 0) > (prev.market_cap ?? 0) ? current : prev))
        : null;

    const result: InsightItem[] = [];

    if (bestPerformer) {
      const change = bestPerformer.price_change_percentage_24h ?? 0;
      result.push({
        id: "best-day",
        title: "Mayor alza 24h",
        metric: bestPerformer.name,
        detail: `${formatPercentage(change)} en 24h`,
        variant: change >= 0 ? "positive" : "negative",
        badge: bestPerformer.symbol.toUpperCase(),
      });
    }

    if (worstPerformer && worstPerformer !== bestPerformer) {
      const change = worstPerformer.price_change_percentage_24h ?? 0;
      result.push({
        id: "worst-day",
        title: "Mayor retroceso 24h",
        metric: worstPerformer.name,
        detail: `${formatPercentage(change)} en 24h`,
        variant: change >= 0 ? "positive" : "negative",
        badge: worstPerformer.symbol.toUpperCase(),
      });
    }

    if (dominantCap && totalMarketCap > 0) {
      const share = ((dominantCap.market_cap ?? 0) / totalMarketCap) * 100;
      result.push({
        id: "top-cap",
        title: "Mayor capitalizacion",
        metric: dominantCap.name,
        detail: `${formatCurrency(dominantCap.market_cap ?? 0, vsCurrency)} - ${share.toFixed(1)}% del grupo`,
        variant: "neutral",
        badge: dominantCap.symbol.toUpperCase(),
      });
    }

    return result;
  }, [coins, vsCurrency]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <section className="insights-banner" aria-label="Resumen inteligente de tendencias">
      {insights.map((insight) => (
        <article key={insight.id} className={`insight-card insight-card--${insight.variant}`}>
          <header className="insight-card__header">
            <span className="insight-card__eyebrow">{insight.title}</span>
            {insight.badge ? <span className="insight-card__badge">{insight.badge}</span> : null}
          </header>
          <p className="insight-card__metric">{insight.metric}</p>
          <p className="insight-card__detail">{insight.detail}</p>
        </article>
      ))}
    </section>
  );
});
