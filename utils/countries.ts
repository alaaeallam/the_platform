// utils/countries.ts
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

export type CountryInfo = {
  code: string;        // ISO-3166 alpha-2, e.g. "EG"
  name: string;        // "Egypt"
  flagEmoji: string;   // 🇪🇬
  flagUrl: string;     // https://flagcdn.com/w40/eg.png
};

function flagEmojiFromCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

function flagUrlFromCode(code: string): string {
  // 40px wide PNG (you can change size: 24/40/80/160)
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

export function getCountryFromCode(code: string): CountryInfo {
  const c = code?.toUpperCase?.() || "US";
  const name = countries.getName(c, "en") ?? "Unknown";
  return {
    code: c,
    name,
    flagEmoji: flagEmojiFromCode(c),
    flagUrl: flagUrlFromCode(c),
  };
}

// (optional) a full map you can import elsewhere
export const COUNTRY_MAP: Record<string, CountryInfo> = Object.fromEntries(
  Object.keys(countries.getAlpha2Codes()).map(code => {
    const upper = code.toUpperCase();
    return [upper, getCountryFromCode(upper)];
  })
);