import { getAllISOCodes, getAllInfoByISO } from "iso-country-currency";

/**
 * Get all ISO 4217 currencies with their symbols, sorted by code
 */
export const getAllCurrencies = () => {
  const allCurrencies = getAllISOCodes();
  return Object.entries(allCurrencies)
    .map(([code, data]) => ({
      code,
      symbol: data.symbol,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
};

/**
 * Detect user's currency from browser locale, fallback to CAD
 */
export const getDefaultCurrency = (): string => {
  try {
    const userLocale = navigator.language || "en-CA";
    const localeInfo = new Intl.Locale(userLocale);

    // Try to extract region from locale
    const region = localeInfo.region || userLocale.split("-")[1];

    if (region) {
      const regionCurrency = getAllInfoByISO(region.toUpperCase());
      if (regionCurrency) {
        return regionCurrency.currency;
      }
    }
  } catch (error) {
    console.error("Error detecting locale currency:", error);
  }

  return "CAD"; // Default fallback
};

/**
 * Get currency info by code
 */
export const getCurrencyByCode = (code: string) => {
  try {
    const info = getAllInfoByISO(code);
    return info.symbol || null;
  } catch {
    return null;
  }
};
