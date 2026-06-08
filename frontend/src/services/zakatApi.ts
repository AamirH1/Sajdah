import { assertApiSuccess, fetchJson } from './http';

export type ZakatStandard = 'classical' | 'common';
export type ZakatUnit = 'g' | 'oz';

export interface ZakatNisabThreshold {
  weight: number;
  unit_price: number;
  nisab_amount: number;
}

export interface ZakatNisabResponse {
  code?: number;
  status?: string;
  calculation_standard?: string;
  currency?: string;
  weight_unit?: string;
  updated_at?: string;
  data?: {
    nisab_thresholds?: {
      gold?: ZakatNisabThreshold;
      silver?: ZakatNisabThreshold;
    };
    zakat_rate?: string;
    notes?: string;
  };
  message?: string;
}

const BASE_URL = 'https://islamicapi.com/api/v1/zakat-nisab/';
const REQUEST_TIMEOUT_MS = 12000;

export const fetchZakatNisab = async (
  standard: ZakatStandard,
  currency: string,
  unit: ZakatUnit,
  apiKey: string
): Promise<ZakatNisabResponse> => {
  if (!apiKey.trim()) {
    throw new Error('Missing IslamicAPI key');
  }

  const params = new URLSearchParams({
    standard,
    currency: currency.toLowerCase(),
    unit,
    api_key: apiKey.trim(),
  });

  const json = (await fetchJson(`${BASE_URL}?${params.toString()}`, REQUEST_TIMEOUT_MS)) as ZakatNisabResponse;
  assertApiSuccess(json, 'Unable to fetch zakat nisab values');

  return json;
};
