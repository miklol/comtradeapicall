/**
 * UN Comtrade API Service Layer
 * Mirrors the Python comtradeapicall package – calls the same REST endpoints directly.
 * Uses the Vite dev-server proxy (/api → https://comtradeapi.un.org)
 */

const BASE = '/api';
const FILES_BASE = '/files';

// ─── helpers ───────────────────────────────────────────────────

function getApiKey() {
  return localStorage.getItem('comtrade_api_key') || null;
}

function buildParams(obj) {
  const entries = Object.entries(obj).filter(([, v]) => v != null && v !== '');
  return new URLSearchParams(entries).toString();
}

async function apiFetch(url, extraParams = {}) {
  const key = getApiKey();
  if (key) extraParams['subscription-key'] = key;
  const qs = buildParams(extraParams);
  const fullUrl = qs ? `${url}?${qs}` : url;
  const resp = await fetch(fullUrl);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API ${resp.status}: ${text.slice(0, 300)}`);
  }
  return resp.json();
}

// ─── Preview / Get Data ────────────────────────────────────────

/**
 * Preview final data (public, no key, max 500)
 */
export async function previewFinalData({
  typeCode = 'C', freqCode = 'A', clCode = 'HS',
  period, reporterCode, cmdCode, flowCode,
  partnerCode, partner2Code, customsCode, motCode,
  maxRecords = 500, aggregateBy, breakdownMode = 'classic',
  countOnly, includeDesc = true,
} = {}) {
  const endpoint = getApiKey()
    ? `${BASE}/data/v1/get/${typeCode}/${freqCode}/${clCode}`
    : `${BASE}/public/v1/preview/${typeCode}/${freqCode}/${clCode}`;
  const json = await apiFetch(endpoint, {
    reportercode: reporterCode, period, cmdCode, flowCode,
    partnerCode, partner2Code, customsCode, motCode,
    maxRecords, aggregateBy, breakdownMode, countOnly, includeDesc,
  });
  return { data: json.data || [], count: json.count, elapsedTime: json.elapsedTime };
}

/**
 * Preview tariffline data (public, no key, max 500)
 */
export async function previewTarifflineData({
  typeCode = 'C', freqCode = 'A', clCode = 'HS',
  period, reporterCode, cmdCode, flowCode,
  partnerCode, partner2Code, customsCode, motCode,
  maxRecords = 500, countOnly, includeDesc = true,
} = {}) {
  const endpoint = getApiKey()
    ? `${BASE}/data/v1/getTariffline/${typeCode}/${freqCode}/${clCode}`
    : `${BASE}/public/v1/previewTariffline/${typeCode}/${freqCode}/${clCode}`;
  const json = await apiFetch(endpoint, {
    reportercode: reporterCode, period, cmdCode, flowCode,
    partnerCode, partner2Code, customsCode, motCode,
    maxRecords, countOnly, includeDesc,
  });
  return { data: json.data || [], count: json.count };
}

/**
 * Get trade balance data (requires key)
 */
export async function getTradeBalance({
  typeCode = 'C', freqCode = 'A', clCode = 'HS',
  period, reporterCode, cmdCode, partnerCode,
  breakdownMode = 'classic', includeDesc = true,
} = {}) {
  const endpoint = `${BASE}/data/v1/get/${typeCode}/${freqCode}/${clCode}`;
  // Trade balance = get exports + imports together
  const json = await apiFetch(endpoint, {
    reportercode: reporterCode, period, cmdCode,
    partnerCode, breakdownMode, includeDesc,
    flowCode: 'X,M',
  });
  return { data: json.data || [], count: json.count };
}

/**
 * Get bilateral data (requires key)
 */
export async function getBilateralData({
  typeCode = 'C', freqCode = 'A', clCode = 'HS',
  period, reporterCode, cmdCode, flowCode,
  partnerCode, includeDesc = true,
} = {}) {
  const endpoint = `${BASE}/data/v1/get/${typeCode}/${freqCode}/${clCode}`;
  const json = await apiFetch(endpoint, {
    reportercode: reporterCode, period, cmdCode, flowCode,
    partnerCode, includeDesc,
  });
  return { data: json.data || [], count: json.count };
}

// ─── Data Availability ─────────────────────────────────────────

export async function getDataAvailability({
  tradeDataType = 'FINAL', availType = null,
  typeCode = 'C', freqCode = 'A', clCode = 'HS',
  period, reporterCode, publishedDateFrom, publishedDateTo,
} = {}) {
  const key = getApiKey();
  let url;
  if (availType === 'BULK') {
    if (tradeDataType === 'TARIFFLINE')
      url = `${BASE}/bulk/v1/getTariffline/${typeCode}/${freqCode}/${clCode}`;
    else
      url = `${BASE}/bulk/v1/get/${typeCode}/${freqCode}/${clCode}`;
  } else {
    const ep = key ? 'data' : 'public';
    if (tradeDataType === 'TARIFFLINE')
      url = `${BASE}/${ep}/v1/getDaTariffline/${typeCode}/${freqCode}/${clCode}`;
    else
      url = `${BASE}/${ep}/v1/getDa/${typeCode}/${freqCode}/${clCode}`;
  }
  const json = await apiFetch(url, {
    reportercode: reporterCode, period, publishedDateFrom, publishedDateTo,
  });
  return { data: json.data || [] };
}

export async function getLiveUpdate() {
  const json = await apiFetch(`${BASE}/data/v1/getLiveUpdate`);
  return { data: json.data || [] };
}

// ─── Metadata ──────────────────────────────────────────────────

export async function getMetadata({
  typeCode = 'C', freqCode = 'A', clCode = 'HS',
  period, reporterCode, showHistory = false,
} = {}) {
  const key = getApiKey();
  const ep = key ? 'data' : 'public';
  const json = await apiFetch(`${BASE}/${ep}/v1/getMetadata/${typeCode}/${freqCode}/${clCode}`, {
    reporterCode, period,
  });
  return { data: json.data || [] };
}

/**
 * List all reference tables
 */
export async function listReference(category = null) {
  const resp = await fetch(`${FILES_BASE}/v1/app/reference/ListofReferences.json`);
  if (!resp.ok) throw new Error(`Failed to fetch references: ${resp.status}`);
  const json = await resp.json();
  let results = json.results || [];
  if (category) results = results.filter(r => r.category === category);
  return results;
}

/**
 * Get contents of a specific reference table
 */
export async function getReference(category) {
  const refs = await listReference(category);
  if (!refs.length) throw new Error(`No reference found for category: ${category}`);
  const fileuri = refs[0].fileuri;
  // The fileuri is an absolute URL on comtradeapi.un.org
  // We proxy /files → comtradeapi.un.org
  const proxiedUrl = fileuri.replace('https://comtradeapi.un.org', '');
  const resp = await fetch(proxiedUrl);
  if (!resp.ok) throw new Error(`Failed to fetch reference ${category}: ${resp.status}`);
  const json = await resp.json();
  return json.results || [];
}

/**
 * Convert ISO3 country codes to Comtrade codes
 */
export async function convertCountryIso3ToCode(iso3String) {
  const resp = await fetch(`${FILES_BASE}/v1/app/reference/country_area_code_iso.json`);
  if (!resp.ok) throw new Error(`Failed to fetch country codes: ${resp.status}`);
  const json = await resp.json();
  const all = json.results || [];
  const isoList = iso3String.split(',').map(s => s.trim().toUpperCase());
  const matched = all.filter(r => isoList.includes(r.iso3));
  return matched.map(r => r.country_area_code).join(',');
}

/**
 * Get reporter (country) list – used in dropdowns
 */
export async function getReporters() {
  return getReference('reporter');
}

/**
 * Get partner list – used in dropdowns
 */
export async function getPartners() {
  return getReference('partner');
}
