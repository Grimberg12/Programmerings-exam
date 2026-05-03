// ── Importer konfiguration ────────────────────────────────────────────────────
const {
  DATAFORDELER_USERNAME,
  DATAFORDELER_PASSWORD,
  DATAFORDELER_BASE_URL,
} = require("../config/env");

// ── Hjælpefunktioner til HTTP og URL-byggeri ──────────────────────────────────
async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Datafordeler fejl ${response.status}: ${text}`);
  }

  return response.json();
}

function buildUrl(path, extraParams = {}) {
  const url = new URL(path, DATAFORDELER_BASE_URL);

  url.searchParams.set("username", DATAFORDELER_USERNAME);
  url.searchParams.set("password", DATAFORDELER_PASSWORD);
  url.searchParams.set("format", "json");

  for (const [key, value] of Object.entries(extraParams)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

// ── Kan muligvis slettes: bruges ikke i nogen route ───────────────────────────
async function hentEjendomsrelationFraAdresseId(adresseId) {
  const url = buildUrl("/BBR/BBRPublic/1/rest/ejendomsrelation", {
    AdresseIdentificerer: adresseId,
    RegistreringFra: "1900-01-01",
    RegistreringTil: "2100-01-01",
  });

  return fetchJson(url);
}

// ── Hent enheder fra Datafordeler ud fra DAR adresse-id ───────────────────────
async function hentEnhederFraAdresseId(adresseId) {
  const url = buildUrl("/BBR/BBRPublic/1/rest/enhed", {
    AdresseIdentificerer: adresseId,
    RegistreringFra: "1900-01-01",
    RegistreringTil: "2100-01-01",
  });

  const data = await fetchJson(url);
  return data;
}

// ── Hent bygning fra Datafordeler ud fra bygning-id ───────────────────────────
async function hentBygningFraId(bygningId) {
  const url = buildUrl("/BBR/BBRPublic/1/rest/bygning", {
    id: bygningId,
    RegistreringFra: "1900-01-01",
    RegistreringTil: "2100-01-01",
  });

  return fetchJson(url);
}

// ── Kan muligvis slettes: grundareal hentes nu direkte fra DAWA ───────────────
async function hentGrundFraId(grundId) {
  const url = buildUrl("/BBR/BBRPublic/1/rest/grund", {
    id: grundId,
    RegistreringFra: "1900-01-01",
    RegistreringTil: "2100-01-01",
  });
  return fetchJson(url);
}

// ── Kan muligvis slettes: grundareal hentes nu direkte fra DAWA ───────────────
async function hentJordstykkeViaDawa(bfeNummer) {
  const url = `https://api.dataforsyningen.dk/jordstykker?bfenummer=${bfeNummer}&format=json`;
  return fetchJson(url);
}

// ── Eksporter funktioner ──────────────────────────────────────────────────────
module.exports = {
  hentEjendomsrelationFraAdresseId,
  hentEnhederFraAdresseId,
  hentBygningFraId,
  hentGrundFraId,
  hentJordstykkeViaDawa,
};
