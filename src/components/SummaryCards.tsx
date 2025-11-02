/**
 * SummaryCards
 *
 * Muestra tarjetas con métricas agregadas del conjunto de monedas seleccionadas:
 * - Capitalización combinada
 * - Variación promedio 24h
 * - Volumen total 24h
 *
 * Recibe `coins` y `vsCurrency` para calcular y formatear los valores.
 */
import type { CoinMarket } from "../types/api";
import { formatCompactNumber, formatCurrency, formatPercentage } from "../utils/format";
import useTranslation from "../i18n";

interface SummaryCardsProps {
  coins: CoinMarket[];
  vsCurrency: string;
}

export function SummaryCards({ coins, vsCurrency }: SummaryCardsProps) {
  if (coins.length === 0) {
    return null;
  }

  const totalMarketCap = coins.reduce((acc, coin) => acc + (coin.market_cap ?? 0), 0);
  const totalVolume = coins.reduce((acc, coin) => acc + (coin.total_volume ?? 0), 0);
  const avgChange =
    coins.reduce((acc, coin) => acc + (coin.price_change_percentage_24h ?? 0), 0) / (coins.length || 1);

  const { t } = useTranslation();
  const assetLabel = t("assetsIncluded", { n: coins.length } as any);
  const averageVariant = avgChange >= 0 ? "positive" : "negative";

  return (
    <section className="summary-grid" aria-label={t("visualizations")}
    >
      <article className="summary-card summary-card--neutral">
        <header className="summary-card__header">
          <span className="summary-card__eyebrow">{t("coverage")}</span>
          <h3 className="summary-card__title">{t("combinedMarketCap")}</h3>
        </header>
        <p className="summary-card__value">{formatCurrency(totalMarketCap, vsCurrency)}</p>
        <p className="summary-card__meta">{assetLabel}</p>
      </article>

      <article className={`summary-card summary-card--${averageVariant}`}>
        <header className="summary-card__header">
          <span className="summary-card__eyebrow">{t("dailyPulse")}</span>
          <h3 className="summary-card__title">{t("avgChangeTitle")}</h3>
        </header>
        <p className="summary-card__value summary-card__value--accent">{formatPercentage(avgChange)}</p>
        <p className="summary-card__meta">{t("avgBasedOnGroup")}</p>
      </article>

      <article className="summary-card summary-card--neutral">
        <header className="summary-card__header">
          <span className="summary-card__eyebrow">{t("liquidity")}</span>
          <h3 className="summary-card__title">{t("totalVolumeTitle")}</h3>
        </header>
        <p className="summary-card__value">{formatCurrency(totalVolume, vsCurrency)}</p>
        <p className="summary-card__meta">{t("tradedIn24h", { n: formatCompactNumber(totalVolume) } as any)}</p>
      </article>
    </section>
  );
}
