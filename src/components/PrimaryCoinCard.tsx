import { memo } from "react";
import type { CoinMarket } from "../types/api";
import { formatCurrency, formatPercentage } from "../utils/format";
import useTranslation from "../i18n";

/**
 * Tarjeta que muestra el resumen del activo principal seleccionado.
 * - Muestra precio, variación 24h, ranking y volumen.
 * - `onRefresh` permite forzar la recarga de datos.
 */

interface PrimaryCoinCardProps {
  coin?: CoinMarket;
  vsCurrency: string;
  loading?: boolean;
  onRefresh?: () => void;
}

export const PrimaryCoinCard = memo(function PrimaryCoinCard({
  coin,
  vsCurrency,
  loading = false,
  onRefresh,
}: PrimaryCoinCardProps) {
  const { t } = useTranslation();
  const changeValue =
    coin?.price_change_percentage_24h === null || coin?.price_change_percentage_24h === undefined
      ? null
      : coin.price_change_percentage_24h;

  const statusClass =
    changeValue === null ? undefined : changeValue >= 0 ? "primary-card__change positive" : "primary-card__change negative";

  return (
  <section className="primary-card" aria-label={t("primaryCardAria")} aria-live="polite">
      <header className="primary-card__header">
        <div className="primary-card__identity">
          {/* translatable strings */}
          <p className="primary-card__eyebrow">{t("primaryEyebrow")}</p>
          <h2 className="primary-card__title">{coin ? coin.name : t("selectCoinPlaceholder")}</h2>
          <p className="primary-card__subtitle">{t("primarySubtitle")}</p>
        </div>
        <div className="primary-card__aside">
          {coin?.image ? (
            <span className="primary-card__avatar" aria-hidden="true">
              <img src={coin.image} alt="" loading="lazy" />
            </span>
          ) : null}
          {onRefresh ? (
            <button type="button" className="primary-card__refresh" onClick={onRefresh} aria-label={t("updateButton")}>
              {t("updateButton")}
            </button>
          ) : null}
        </div>
      </header>

      {loading ? (
        <div className="primary-card__skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : coin ? (
        <div className="primary-card__body">
          <div className="primary-card__price">
            <span className="primary-card__price-label">{t("priceLabel")}</span>
            <span className="primary-card__price-value">{formatCurrency(coin.current_price, vsCurrency)}</span>
            {changeValue !== null ? (
              <span className={statusClass}>{formatPercentage(changeValue)}{t("priceChangeSuffix")}</span>
            ) : (
              <span className="primary-card__change neutral">{t("noChange")}</span>
            )}
          </div>

          <dl className="primary-card__stats">
            <div>
              <dt>{t("rankingLabel")}</dt>
              <dd>{coin.market_cap_rank ? `#${coin.market_cap_rank}` : t("noData")}</dd>
            </div>
            <div>
              <dt>{t("marketCapLabel")}</dt>
              <dd>{formatCurrency(coin.market_cap ?? 0, vsCurrency)}</dd>
            </div>
            <div>
              <dt>{t("volumeLabel")}</dt>
              <dd>{formatCurrency(coin.total_volume ?? 0, vsCurrency)}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="primary-card__empty">
          <p>{t("selectAtLeastOne")}</p>
        </div>
      )}
    </section>
  );
});
