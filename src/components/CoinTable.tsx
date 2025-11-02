/**
 * Componente que muestra una tabla con las monedas seleccionadas y sus métricas.
 * - Recibe `coins` y `vsCurrency` para formatear los valores.
 * - El contenedor tiene `aria-live="polite"` para anunciar cambios de forma accesible.
 */
import type { CoinMarket } from "../types/api";
import { formatCurrency, formatPercentage } from "../utils/format";
import useTranslation from "../i18n";

interface CoinTableProps {
  coins: CoinMarket[];
  vsCurrency: string;
}

export function CoinTable({ coins, vsCurrency }: CoinTableProps) {
  if (coins.length === 0) {
    return null;
  }

  const { t } = useTranslation();

  return (
    <section className="coin-table-section" aria-label={t("coinTableAria")}>
      <header>
        <h2>{t("coinTableTitle")}</h2>
        <p>{t("coinTableDesc")}</p>
      </header>
      <div className="table-container" role="region" aria-live="polite">
        <table>
          <caption className="sr-only">{t("coinTableCaption")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("asset")}</th>
              <th scope="col">{t("price")}</th>
              <th scope="col">{t("change24h")}</th>
              <th scope="col">{t("marketCap")}</th>
              <th scope="col">{t("volume")}</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin) => (
              <tr key={coin.id}>
                <th scope="row">
                  <div className="coin-cell">
                    <img src={coin.image} alt={t("logoAlt", { name: coin.name } as any)} loading="lazy" />
                    <div>
                      <span className="coin-name">{coin.name}</span>
                      <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
                    </div>
                  </div>
                </th>
                <td>{formatCurrency(coin.current_price, vsCurrency)}</td>
                <td
                  className={
                    coin.price_change_percentage_24h === null
                      ? undefined
                      : coin.price_change_percentage_24h >= 0
                        ? "positive"
                        : "negative"
                  }
                >
                  {formatPercentage(coin.price_change_percentage_24h)}
                </td>
                <td>{formatCurrency(coin.market_cap ?? 0, vsCurrency)}</td>
                <td>{formatCurrency(coin.total_volume ?? 0, vsCurrency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
