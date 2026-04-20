// BBR full payload test
// Korrekt endpoint ifølge SDFI Confluence (pageid=187105439):
//   https://graphql.datafordeler.dk/BBR/v1?apiKey=<nøgle>
// Auth: apiKey som query-parameter (ikke token/username/password)
//
// Meningen er at teste full payload fra alle api links
//
// Run: node testbbr.js [adresse]
// Eks: node testbbr.js "Amagertorv 1, København"

const API_KEY =
  "flFZXadD4pX6spLeMhayqWP3nObREU3wHi43bT56bP2jXXAmx52uD7T6byU2Be1cS1XwEViikNPtExEOJ17wO7PaiolWtKFqD";

const TEST_ADDRESS = process.argv[2] || "Amagertorv 1, København";
const NOW = new Date().toISOString();

// Prioriteret endpoint-liste (v1 først, v2 bagud-kompatibelt)
const BBR_ENDPOINTS = [
  `https://graphql.datafordeler.dk/BBR/v1?apiKey=${API_KEY}`,
  `https://graphql.datafordeler.dk/BBR/v2?apiKey=${API_KEY}`,
];

// ── DAWA ──────────────────────────────────────────────────────────────────────

async function lookupAddress(q) {
  console.log(`\n[DAWA] Søger: "${q}"`);
  const url = `https://api.dataforsyningen.dk/adresser?q=${encodeURIComponent(q)}&format=json&per_side=1`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.length) throw new Error("Ingen DAWA-resultater for: " + q);

  const hit = data[0];
  const adgangsId = hit.adgangsadresse?.id;

  console.log(`[DAWA] Fandt: ${hit.adressebetegnelse}`);
  console.log(`[DAWA] adgangsadresse.id = ${adgangsId}`);
  console.log("\n[DAWA] Fuld adresse-response:");
  console.log(JSON.stringify(hit, null, 2));

  return { adgangsId, label: hit.adressebetegnelse };
}

// ── BBR queries ───────────────────────────────────────────────────────────────

function enhedOpgangQuery(adgangsId) {
  return `
{
  BBR_Enhed(
    first: 5
    virkningstid: "${NOW}"
    where: { husnummer: { eq: "${adgangsId}" } }
  ) {
    nodes {
      id_lokalId
      status
      enh020Udlejningsforhold
      enh023Boligtype
      enh026EnhedensAnvendelse
      enh027EnhedensBoligareal
      enh028EnhedensArealTilErhverv
      enh031AntalVaerelser
      enh032AntalBadevaerelser
      enh033AntalSoverum
      enh037KildeTilEnhedensArealer
      enh038SupplerendeIndvendigAreal
      enh050Energiforsyning
      enh071BygningsoplysningerKilde
      bygning
      etagebetegnelse
      doerbetegnelse
    }
  }

  BBR_Opgang(
    first: 5
    virkningstid: "${NOW}"
    where: { adgangFraHusnummer: { eq: "${adgangsId}" } }
  ) {
    nodes {
      id_lokalId
      adgangFraHusnummer
      bygning
    }
  }
}`.trim();
}

function bygningQuery(bygningId) {
  return `
{
  BBR_Bygning(
    first: 1
    virkningstid: "${NOW}"
    where: { id_lokalId: { eq: "${bygningId}" } }
  ) {
    nodes {
      id_lokalId
      status
      kommunekode
      byg020BygningensAnvendelse
      byg021BygningensAnvendelse
      byg024AntalEtager
      byg026Opfoerelsesaar
      byg027OmTilbygningsaar
      byg032YdervæggensMateriale
      byg033Tagdækningsmateriale
      byg038SamletBygningsareal
      byg039BygningensSamledeBoligAreal
      byg040BygningensSamledeErhvervsAreal
      byg041BebyggetAreal
      byg056Varmeinstallation
      byg058SupplerendeVarme
      byg094Revisionsdato
    }
  }
}`.trim();
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function postGraphQL(endpoint, query) {
  const safeUrl = endpoint.replace(API_KEY, "***KEY***");
  console.log(`\n[BBR] POST → ${safeUrl}`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  console.log(`[BBR] HTTP ${res.status} ${res.statusText}`);
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.log("[BBR] Svar er ikke JSON:", text.slice(0, 800));
    return null;
  }

  if (data.errors?.length) {
    console.log("[BBR] GraphQL errors:", JSON.stringify(data.errors, null, 2));
  }

  return data;
}

async function tryEndpoints(query, label) {
  for (const ep of BBR_ENDPOINTS) {
    const result = await postGraphQL(ep, query);
    if (result?.data) {
      console.log(`\n[BBR] ${label} — data:`);
      console.log(JSON.stringify(result.data, null, 2));
      return result.data;
    }
  }
  console.log(`\n[BBR] ${label} — ingen endpoint returnerede data.`);
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Find adgangsadresse.id via DAWA
  const { adgangsId } = await lookupAddress(TEST_ADDRESS);
  if (!adgangsId) throw new Error("Mangler adgangsadresse.id fra DAWA");

  // 2. BBR Enhed + Opgang
  const bbrData = await tryEndpoints(enhedOpgangQuery(adgangsId), "Enhed + Opgang");

  // 3. BBR Bygning (via bygning-ID fra Enhed eller Opgang)
  const bygningId =
    bbrData?.BBR_Enhed?.nodes?.[0]?.bygning ||
    bbrData?.BBR_Opgang?.nodes?.[0]?.bygning;

  if (!bygningId) {
    console.log("\n[BBR] Intet bygning-ID fundet — springer Bygning-query over.");
    return;
  }

  console.log(`\n[BBR] Henter bygning: ${bygningId}`);
  await tryEndpoints(bygningQuery(bygningId), "Bygning");
}

main().catch((err) => {
  console.error("\n[FEJL]", err.message);
  process.exit(1);
});
