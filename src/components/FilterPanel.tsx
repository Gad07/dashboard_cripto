import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import type { CoinMarket, DashboardFilters } from "../types/api";
import useTranslation from "../i18n";

/**
 * FilterPanel
 *
 * Panel lateral que permite al usuario:
 * - Seleccionar moneda de referencia (vsCurrency).
 * - Elegir la moneda primaria y las monedas comparadas (hasta MAX_SELECTION).
 * - Buscar activos por nombre o símbolo y seleccionar rango de tiempo.
 *
 * Comunica cambios al padre mediante `onFiltersChange` (updater funcional).
 */

const SUPPORTED_CURRENCIES = ["usd", "eur", "mxn", "ars", "gbp"];
const MAX_SELECTION = 5;

interface FilterPanelProps {
  filters: DashboardFilters;
  availableCoins: CoinMarket[];
  onFiltersChange: (updater: (filters: DashboardFilters) => DashboardFilters) => void;
  disabled?: boolean;
}

export function FilterPanel({ filters, availableCoins, onFiltersChange, disabled = false }: FilterPanelProps) {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const topCoins = useMemo(() => availableCoins.slice(0, 18), [availableCoins]);
  const normalizedQuery = searchTerm.trim().toLowerCase();

  const filteredCoins = useMemo(() => {
    const pool = normalizedQuery ? availableCoins : topCoins;
    return pool
      .filter((coin) => {
        if (!normalizedQuery) return true;
        return coin.name.toLowerCase().includes(normalizedQuery) || coin.symbol.toLowerCase().includes(normalizedQuery);
      })
      .slice(0, normalizedQuery ? 24 : pool.length);
  }, [availableCoins, normalizedQuery, topCoins]);

  const selectedSet = useMemo(() => new Set(filters.selectedCoins), [filters.selectedCoins]);

  const { t } = useTranslation();

  const handleCurrencyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onFiltersChange((prev) => ({ ...prev, vsCurrency: value }));
  };

  const handlePrimaryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onFiltersChange((prev) => ({ ...prev, primaryCoin: value }));
  };

  const handleRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    onFiltersChange((prev) => ({ ...prev, timeRange: value }));
  };

  const handleCoinToggle = (coinId: string) => {
    const coinName = availableCoins.find((coin) => coin.id === coinId)?.name ?? coinId;

    onFiltersChange((prev) => {
      const alreadySelected = prev.selectedCoins.includes(coinId);

      if (alreadySelected) {
        if (prev.selectedCoins.length === 1) {
          setAnnouncement(t("filterMustKeepOne"));
          return prev;
        }
        const remaining = prev.selectedCoins.filter((id) => id !== coinId);
        const nextPrimary = remaining.includes(prev.primaryCoin) ? prev.primaryCoin : remaining[0];
        setAnnouncement(t("removedFromAnalysis", { name: coinName } as any));
        return {
          ...prev,
          selectedCoins: remaining,
          primaryCoin: nextPrimary ?? remaining[0] ?? prev.primaryCoin,
        };
      }

      if (prev.selectedCoins.length >= MAX_SELECTION) {
        setAnnouncement(t("selectionLimitReached", { max: MAX_SELECTION } as any));
        return prev;
      }

      setAnnouncement(t("addedToAnalysis", { name: coinName } as any));
      return {
        ...prev,
        selectedCoins: [...prev.selectedCoins, coinId],
      };
    });
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => setSearchTerm("");

  return (
  <section className="filter-panel" aria-label={t("assetsLegend")}
  >
      <div className="filter-field">
        <label htmlFor="currency">{t("currencyLabel")}</label>
        <select
          id="currency"
          value={filters.vsCurrency}
          onChange={handleCurrencyChange}
          disabled={disabled}
          aria-describedby="currency-help"
        >
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency.toUpperCase()}
            </option>
          ))}
        </select>
        <p id="currency-help">{t("currencyHelp")}</p>
      </div>

      <div className="filter-field">
        <label htmlFor="primaryCoin">{t("primaryLabel")}</label>
        <select
          id="primaryCoin"
          value={filters.primaryCoin}
          onChange={handlePrimaryChange}
          disabled={disabled || filters.selectedCoins.length === 0}
        >
          {/* placeholder option so there's no default selected value */}
          <option value="">{t("selectCoinPlaceholder")}</option>
          {filters.selectedCoins.map((coinId) => {
            const match = availableCoins.find((coin) => coin.id === coinId);
            return (
              <option key={coinId} value={coinId}>
                {match ? match.name : coinId}
              </option>
            );
          })}
        </select>
        <p>{t("primaryHelp")}</p>
      </div>

      <fieldset className="filter-field coin-selection" disabled={disabled}>
  <legend>{t("assetsLegend")}</legend>
        <div className="coin-selection__header">
            <p id="coin-selection-hint">
              {t("selectedCoinsHint", { max: MAX_SELECTION, current: filters.selectedCoins.length } as any)}
          </p>
          <label htmlFor="coin-search" className="sr-only">
            {t("searchLabel")}
          </label>
          <div className="filter-search">
            <input
              id="coin-search"
              type="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t("searchPlaceholder")}
              disabled={disabled}
            />
            {searchTerm ? (
              <button type="button" onClick={clearSearch} className="search-clear" aria-label={t("clearSearch")}>
                x
              </button>
            ) : null}
          </div>
        </div>

        {filters.selectedCoins.length > 0 ? (
          <ul className="selected-coins" aria-label={t("selectedCoinsAria")}>
            {filters.selectedCoins.map((coinId) => {
              const match = availableCoins.find((coin) => coin.id === coinId);
              const label = match ? match.name + " (" + match.symbol.toUpperCase() + ")" : coinId;
              return (
                <li key={coinId}>
                  <button
                    type="button"
                    className="selected-coin"
                    onClick={() => handleCoinToggle(coinId)}
                    disabled={disabled}
                      aria-label={t("removeButton", { label } as any)}
                  >
                    {label}
                    <span aria-hidden="true">x</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="coin-grid" role="group" aria-describedby="coin-selection-hint">
          {filteredCoins.length > 0 ? (
            filteredCoins.map((coin) => (
              <label key={coin.id} className="coin-option">
                <input
                  type="checkbox"
                  checked={selectedSet.has(coin.id)}
                  onChange={() => handleCoinToggle(coin.id)}
                  disabled={disabled}
                />
                <span>
                  {coin.name} <small>({coin.symbol.toUpperCase()})</small>
                </span>
              </label>
            ))
          ) : (
            <p className="empty-state">{t("noneFound")}</p>
          )}
        </div>
      </fieldset>

        <div className="filter-field">
        <span className="field-label">{t("timeRangeLabel")}</span>
        <div className="range-options" role="radiogroup" aria-label={t("timeRangeAria")}>
          {[7, 30, 90, 180].map((range) => (
            <label key={range} className="range-option">
              <input
                type="radio"
                name="timeRange"
                value={range}
                checked={filters.timeRange === range}
                onChange={handleRangeChange}
                disabled={disabled}
              />
              <span>{t("days", { n: range } as any)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </section>
  );
}
