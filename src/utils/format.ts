/**
 * Formatea un número como moneda según el código de divisa.
 * @param value - Valor numérico a formatear.
 * @param currencyCode - Código de moneda (ej. "usd", "eur").
 */
export function formatCurrency(value: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

/**
 * Formatea números en notación compacta (p. ej. 1.2K, 3.4M).
 */
export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Formatea un porcentaje mostrando signo + para incrementos positivos.
 */
export function formatPercentage(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

/**
 * Formatea un timestamp (ms) a una cadena legible (mes día, hora).
 */
export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
  }).format(timestamp);
}

/** Suma un array de números. */
export function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

/**
 * Formatea una proporción (0-1) a porcentaje con 2 decimales.
 */
export function formatShare(value: number) {
  if (Number.isNaN(value)) return "0%";
  return `${(value * 100).toFixed(2)}%`;
}
