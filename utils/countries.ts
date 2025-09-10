// utils/countries.ts
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

export type CountryInfo = {
  code: string;
  name: string;
  flagEmoji: string;
  flagUrl: string;
};

export function getCountryFromCode(code: string): CountryInfo {
  const upper = code?.toUpperCase?.() || "US";
  const name = countries.getName(upper, "en") ?? "Unknown";

  return {
    code: upper,
    name,
    flagEmoji: getFlagEmoji(upper),
    flagUrl: `https://flagcdn.com/w40/${upper.toLowerCase()}.png`,
  };
}

function getFlagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}