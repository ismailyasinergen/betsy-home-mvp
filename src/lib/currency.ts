export type SupportedCurrency = "USD" | "EUR";

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["USD", "EUR"];

const EURO_COUNTRY_CODES = new Set([
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES"
]);

const EURO_LANGUAGE_PREFIXES = [
  "de", "fr", "it", "es", "pt", "nl", "el", "fi", "sk", "sl", "et", "lv", "lt", "ga", "mt"
];

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return value === "USD" || value === "EUR";
}

export function detectCurrencyFromLocale(locale?: string | null): SupportedCurrency {
  if (!locale) return "USD";

  const normalized = locale.replace("_", "-");
  const parts = normalized.split("-");
  const language = parts[0]?.toLowerCase();
  const country = parts[1]?.toUpperCase();

  if (country && EURO_COUNTRY_CODES.has(country)) return "EUR";
  if (language && EURO_LANGUAGE_PREFIXES.includes(language)) return "EUR";

  return "USD";
}

export function getStoredCurrency(): SupportedCurrency | null {
  if (typeof window === "undefined") return null;

  const localValue = window.localStorage.getItem("betsy_currency");
  if (isSupportedCurrency(localValue)) return localValue;

  const cookieValue = document.cookie
    .split("; ")
    .find((item) => item.startsWith("betsy_currency="))
    ?.split("=")[1];

  if (isSupportedCurrency(cookieValue)) return cookieValue;

  return null;
}

export function getPreferredCurrency(): SupportedCurrency {
  const stored = getStoredCurrency();
  if (stored) return stored;

  if (typeof navigator !== "undefined") {
    return detectCurrencyFromLocale(navigator.language);
  }

  return "USD";
}

export function savePreferredCurrency(currency: SupportedCurrency) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem("betsy_currency", currency);
  document.cookie = `betsy_currency=${currency}; path=/; max-age=31536000; samesite=lax`;

  window.dispatchEvent(new CustomEvent("betsy-currency-change", { detail: currency }));
}

export function convertMoney(
  amount: number,
  fromCurrency: SupportedCurrency = "USD",
  toCurrency: SupportedCurrency = "USD"
) {
  if (fromCurrency === toCurrency) return amount;

  const usdToEur = Number(process.env.NEXT_PUBLIC_USD_TO_EUR_RATE || "0.92");

  if (fromCurrency === "USD" && toCurrency === "EUR") {
    return amount * usdToEur;
  }

  if (fromCurrency === "EUR" && toCurrency === "USD") {
    return amount / usdToEur;
  }

  return amount;
}

export function formatMoney(
  amount: number,
  currency: SupportedCurrency,
  locale?: string
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol"
  }).format(amount);
}
