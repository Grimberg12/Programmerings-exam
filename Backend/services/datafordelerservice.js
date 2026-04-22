const {
  DATAFORDELER_USERNAME,
  DATAFORDELER_PASSWORD,
  DATAFORDELER_BASE_URL,
} = require("../config/env");

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

async function hentEjendomsrelationFraAdresseId(adresseId) {
  const url = buildUrl("/BBR/BBRPublic/1/rest/ejendomsrelation", {
    AdresseIdentificerer: adresseId,
    RegistreringFra: "1900-01-01",
    RegistreringTil: "2100-01-01",
  });

  return fetchJson(url);
}

// Henter enheder ud fra et DAR adresse-id
// Denne funktion bruges til at finde enhedsdata som fx areal og antal værelser
async function hentEnhederFraAdresseId(adresseId) {
  // Bygger URL til Datafordeler endpointet for enhed
  const url = buildUrl("/BBR/BBRPublic/1/rest/enhed", {
    AdresseIdentificerer: adresseId,
    RegistreringFra: "1900-01-01",
    RegistreringTil: "2100-01-01",
  });

  // Kalder endpointet og returnerer JSON-svaret
  return fetchJson(url);
}

async function hentBygningFraId(bygningId) {
  const url = buildUrl("/BBR/BBRPublic/1/rest/bygning", {
    id: bygningId,
    RegistreringFra: "1900-01-01",
    RegistreringTil: "2100-01-01",
  });
  return fetchJson(url);
}

// Henter grunddata fra BBR ud fra et grund-id
// Grund-id'et findes i bygning-objektets 'grund'-felt
async function hentGrundFraId(grundId) {
  const url = buildUrl("/BBR/BBRPublic/1/rest/grund", {
    id: grundId,
    RegistreringFra: "1900-01-01",
    RegistreringTil: "2100-01-01",
  });
  return fetchJson(url);
}

async function hentJordstykkeViaDawa(bfeNummer) {
  const url = `https://api.dataforsyningen.dk/jordstykker?bfenummer=${bfeNummer}&format=json`;
  return fetchJson(url);
}

module.exports = {
  hentEjendomsrelationFraAdresseId,
  hentEnhederFraAdresseId,
  hentBygningFraId,
  hentGrundFraId,
  hentJordstykkeViaDawa,
};