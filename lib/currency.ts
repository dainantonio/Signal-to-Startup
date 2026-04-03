import { COUNTRY_CONTEXT } from './rss-sources';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  usdRate: number;
  locale: string;
}

export const CURRENCY_MAP: Record<string, CurrencyConfig> = {
  // Caribbean
  JMD: { code: 'JMD', symbol: 'J$',   name: 'Jamaican Dollar',    usdRate: 157,  locale: 'en-JM' },
  TTD: { code: 'TTD', symbol: 'TT$',  name: 'Trinidad Dollar',    usdRate: 6.8,  locale: 'en-TT' },
  BBD: { code: 'BBD', symbol: 'Bds$', name: 'Barbados Dollar',    usdRate: 2.0,  locale: 'en-BB' },
  GYD: { code: 'GYD', symbol: 'G$',   name: 'Guyana Dollar',      usdRate: 209,  locale: 'en-GY' },
  // Africa
  NGN: { code: 'NGN', symbol: '₦',    name: 'Nigerian Naira',     usdRate: 1580, locale: 'en-NG' },
  GHS: { code: 'GHS', symbol: 'GH₵',  name: 'Ghanaian Cedi',      usdRate: 15.4, locale: 'en-GH' },
  KES: { code: 'KES', symbol: 'KSh',  name: 'Kenyan Shilling',    usdRate: 129,  locale: 'en-KE' },
  ZAR: { code: 'ZAR', symbol: 'R',    name: 'South African Rand', usdRate: 18.5, locale: 'en-ZA' },
  // UK / Europe
  GBP: { code: 'GBP', symbol: '£',    name: 'British Pound',      usdRate: 0.79, locale: 'en-GB' },
  EUR: { code: 'EUR', symbol: '€',    name: 'Euro',               usdRate: 0.92, locale: 'en-EU' },
  // LatAm
  MXN: { code: 'MXN', symbol: 'MX$',  name: 'Mexican Peso',       usdRate: 17.2, locale: 'es-MX' },
  BRL: { code: 'BRL', symbol: 'R$',   name: 'Brazilian Real',     usdRate: 5.1,  locale: 'pt-BR' },
  COP: { code: 'COP', symbol: 'COL$', name: 'Colombian Peso',     usdRate: 3900, locale: 'es-CO' },
  ARS: { code: 'ARS', symbol: '$',    name: 'Argentine Peso',     usdRate: 900,  locale: 'es-AR' },
  // Default
  USD: { code: 'USD', symbol: '$',    name: 'US Dollar',          usdRate: 1,    locale: 'en-US' },
};

export function getCurrencyForCountry(countryTag: string): CurrencyConfig {
  if (!countryTag) return CURRENCY_MAP.USD;
  const ctx = COUNTRY_CONTEXT[countryTag.toLowerCase()];
  if (!ctx) return CURRENCY_MAP.USD;
  return CURRENCY_MAP[ctx.currency] ?? CURRENCY_MAP.USD;
}

export function formatCurrency(
  usdAmount: number,
  currency: CurrencyConfig,
  showBoth: boolean = true,
): string {
  if (!usdAmount && usdAmount !== 0) return '—';
  const localAmount = Math.round(usdAmount * currency.usdRate);
  const localFormatted = localAmount.toLocaleString(currency.locale);

  if (currency.code === 'USD' || !showBoth) {
    return `$${usdAmount.toLocaleString()}`;
  }

  return `${currency.symbol}${localFormatted} (~$${usdAmount.toLocaleString()} USD)`;
}
