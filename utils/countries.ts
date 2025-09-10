import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

// Register English locale once
countries.registerLocale(enLocale);

export type CountryInfo = {
  code: string;
  name: string;
  flag: string;
};

// Build COUNTRY_MAP dynamically
export const COUNTRY_MAP: Record<string, CountryInfo> = Object.fromEntries(
  Object.keys(countries.getAlpha2Codes()).map((code) => [
    code,
    {
      code,
      name: countries.getName(code, "en") ?? "Unknown",
      flag: getFlagEmoji(code),
    },
  ])
);

function getFlagEmoji(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}