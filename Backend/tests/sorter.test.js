"use strict";

// ── Node.js built-in testmodul (kræver ingen installation) ────────────────────
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// ── Funktion kopieret fra Frontend/js/cases.js ────────────────────────────────
// Ren sorteringsfunktion uden DOM-afhængigheder.

function sorter(cases, valg) {
  const k = [...cases];
  if (valg === "dato-desc") return k.sort((a, b) => new Date(b.oprettetDato) - new Date(a.oprettetDato));
  if (valg === "dato-asc") return k.sort((a, b) => new Date(a.oprettetDato) - new Date(b.oprettetDato));
  if (valg === "adresse") return k.sort((a, b) => a.adresse.localeCompare(b.adresse, "da"));
  if (valg === "pris-desc") return k.sort((a, b) => b.købspris - a.købspris);
  if (valg === "pris-asc") return k.sort((a, b) => a.købspris - b.købspris);
  if (valg === "egenkapital") return k.sort((a, b) => b.egenkapital - a.egenkapital);
  if (valg === "areal-desc") return k.sort((a, b) => b.areal - a.areal);
  return k;
}

// ── Testdata ──────────────────────────────────────────────────────────────────

const cases = [
  { id: 1, oprettetDato: "2024-01-15", adresse: "Ørstedsvej 10, 2000 Frederiksberg", købspris: 3_000_000, egenkapital: 500_000, areal: 80 },
  { id: 2, oprettetDato: "2025-06-01", adresse: "Ågade 5, 2200 København N",          købspris: 1_500_000, egenkapital: 800_000, areal: 55 },
  { id: 3, oprettetDato: "2023-11-20", adresse: "Amagerbrogade 22, 2300 København S", købspris: 2_200_000, egenkapital: 300_000, areal: 70 },
];

// ── Tests: sorter ─────────────────────────────────────────────────────────────

describe("sorter", () => {

  it("sorterer nyest dato først (dato-desc)", () => {
    const result = sorter(cases, "dato-desc");
    assert.strictEqual(result[0].id, 2, "2025-06-01 skal stå først");
    assert.strictEqual(result[2].id, 3, "2023-11-20 skal stå sidst");
  });

  it("sorterer ældste dato først (dato-asc)", () => {
    const result = sorter(cases, "dato-asc");
    assert.strictEqual(result[0].id, 3, "2023-11-20 skal stå først");
    assert.strictEqual(result[2].id, 2, "2025-06-01 skal stå sidst");
  });

  it("sorterer højeste pris først (pris-desc)", () => {
    const result = sorter(cases, "pris-desc");
    assert.strictEqual(result[0].id, 1, "3.000.000 kr skal stå først");
    assert.strictEqual(result[2].id, 2, "1.500.000 kr skal stå sidst");
  });

  it("sorterer laveste pris først (pris-asc)", () => {
    const result = sorter(cases, "pris-asc");
    assert.strictEqual(result[0].id, 2, "1.500.000 kr skal stå først");
    assert.strictEqual(result[2].id, 1, "3.000.000 kr skal stå sidst");
  });

  it("sorterer højeste egenkapital først", () => {
    const result = sorter(cases, "egenkapital");
    assert.strictEqual(result[0].id, 2, "800.000 kr egenkapital skal stå først");
  });

  it("sorterer største areal først (areal-desc)", () => {
    const result = sorter(cases, "areal-desc");
    assert.strictEqual(result[0].id, 1, "80 m² skal stå først");
    assert.strictEqual(result[2].id, 2, "55 m² skal stå sidst");
  });

  it("sorterer adresse korrekt med dansk alfabetsortering", () => {
    // Dansk alfabet: A-Z, Æ, Ø, Å — dvs. Ø (28.) kommer FØR Å (29.)
    const result = sorter(cases, "adresse");
    assert.strictEqual(result[0].id, 3, "Amagerbrogade skal stå først (A er første bogstav)");
    assert.strictEqual(result[1].id, 1, "Ørstedsvej skal stå i midten (Ø < Å i dansk)");
    assert.strictEqual(result[2].id, 2, "Ågade skal stå sidst (Å er det sidste bogstav i dansk)");
  });

  it("returnerer uændret rækkefølge ved ukendt sorteringsvalg", () => {
    const result = sorter(cases, "ukendt-valg");
    assert.strictEqual(result[0].id, cases[0].id);
    assert.strictEqual(result[1].id, cases[1].id);
    assert.strictEqual(result[2].id, cases[2].id);
  });

  it("muterer ikke det originale array", () => {
    const original = [...cases];
    sorter(cases, "pris-desc");
    assert.strictEqual(cases[0].id, original[0].id,
      "sorter() må ikke ændre det originale array");
  });

  it("håndterer tomt array uden fejl", () => {
    const result = sorter([], "pris-desc");
    assert.deepStrictEqual(result, []);
  });

});
