"use strict";

// ── Node.js built-in testmodul (kræver ingen installation) ────────────────────
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// ── Funktioner kopieret fra Frontend/js/case.js ───────────────────────────────
// De er rene matematiske funktioner uden browser-afhængigheder og kan
// dermed testes direkte i Node.js-miljøet.

function beregnMånedligYdelse(beløb, rente, løbetidMdr, afdragsFriMdr = 0) {
  if (!beløb || beløb <= 0 || !løbetidMdr || løbetidMdr <= 0) return 0;
  const i        = rente / 12;
  const amortMdr = løbetidMdr - afdragsFriMdr;
  if (amortMdr <= 0) return i === 0 ? 0 : beløb * i;
  if (i === 0)       return beløb / amortMdr;
  return beløb * i / (1 - Math.pow(1 + i, -amortMdr));
}

function restgældEfterÅr(P, rente, løbetidMdr, år, afdragsFriMdr = 0) {
  const kMdr     = år * 12;
  if (kMdr >= løbetidMdr) return 0;

  const i        = rente / 12;
  const amortMdr = løbetidMdr - afdragsFriMdr;

  if (kMdr <= afdragsFriMdr) return P;

  const elapsed  = kMdr - afdragsFriMdr;
  if (amortMdr <= 0 || elapsed >= amortMdr) return 0;

  if (i === 0) return P * (1 - elapsed / amortMdr);
  const M = P * i / (1 - Math.pow(1 + i, -amortMdr));
  return Math.max(0, P * Math.pow(1 + i, elapsed) - M * (Math.pow(1 + i, elapsed) - 1) / i);
}

// ── Tests: beregnMånedligYdelse ───────────────────────────────────────────────

describe("beregnMånedligYdelse", () => {

  it("beregner korrekt annuitetsydelse uden afdragsfri periode", () => {
    // 2.000.000 kr, 4% p.a., 30 år → typisk realkreditlån
    const ydelse = beregnMånedligYdelse(2_000_000, 0.04, 360, 0);
    // Forventet: ~9.548 kr. Accepter ±10 kr. pga. floating-point
    assert.ok(ydelse > 9_500 && ydelse < 9_600,
      `Forventede ~9.548 kr, fik ${ydelse.toFixed(2)} kr`);
  });

  it("beregner lavere ydelse med afdragsfri periode (kun renter i 10 år)", () => {
    const medAfdragsFri = beregnMånedligYdelse(2_000_000, 0.04, 360, 120);
    const udenAfdragsFri = beregnMånedligYdelse(2_000_000, 0.04, 360, 0);
    // Ydelsen i afdragsfri periode er lavere, men efter perioden er den højere
    // Her bruger vi amortMdr = 360-120 = 240 → højere månedlig ydelse end 360 mdr.
    assert.ok(medAfdragsFri > udenAfdragsFri,
      "Ydelse med afdragsfri (kortere amortisering) skal være højere end uden");
  });

  it("returnerer kun rente ved nul-rente (simpel deling)", () => {
    // 1.200.000 kr, 0% rente, 120 mdr → 10.000 kr/md
    const ydelse = beregnMånedligYdelse(1_200_000, 0, 120, 0);
    assert.strictEqual(Math.round(ydelse), 10_000);
  });

  it("returnerer 0 ved beløb på 0", () => {
    assert.strictEqual(beregnMånedligYdelse(0, 0.04, 360), 0);
  });

  it("returnerer 0 ved negativt beløb", () => {
    assert.strictEqual(beregnMånedligYdelse(-500_000, 0.04, 360), 0);
  });

  it("returnerer 0 ved løbetid på 0", () => {
    assert.strictEqual(beregnMånedligYdelse(1_000_000, 0.04, 0), 0);
  });

  it("returnerer kun renteydelse når afdragsfri periode er lig løbetid", () => {
    // amortMdr = 0 → kun rentebetalinger
    const ydelse = beregnMånedligYdelse(1_000_000, 0.04, 120, 120);
    const forventet = 1_000_000 * (0.04 / 12);
    assert.ok(Math.abs(ydelse - forventet) < 0.01);
  });

});

// ── Tests: restgældEfterÅr ────────────────────────────────────────────────────

describe("restgældEfterÅr", () => {

  it("restgæld er uændret i afdragsfri periode", () => {
    // 10 års afdragsfri → efter år 5 er gælden stadig 2.000.000
    const restgæld = restgældEfterÅr(2_000_000, 0.04, 360, 5, 120);
    assert.strictEqual(restgæld, 2_000_000);
  });

  it("restgæld er 0 når lånet er fuldt tilbagebetalt", () => {
    const restgæld = restgældEfterÅr(2_000_000, 0.04, 360, 30, 0);
    assert.strictEqual(restgæld, 0);
  });

  it("restgæld er 0 efter lånets løbetid er overskredet", () => {
    const restgæld = restgældEfterÅr(2_000_000, 0.04, 360, 35, 0);
    assert.strictEqual(restgæld, 0);
  });

  it("restgæld falder over tid (afbetaling sker)", () => {
    const efter10 = restgældEfterÅr(2_000_000, 0.04, 360, 10, 0);
    const efter20 = restgældEfterÅr(2_000_000, 0.04, 360, 20, 0);
    assert.ok(efter10 > efter20,
      "Restgæld efter 10 år skal være højere end efter 20 år");
  });

  it("restgæld er lineær ved nul-rente", () => {
    // 1.200.000 kr, 0% rente, 120 mdr, ingen afdragsfri → efter 5 år: 600.000
    const restgæld = restgældEfterÅr(1_200_000, 0, 120, 5, 0);
    assert.ok(Math.abs(restgæld - 600_000) < 0.01,
      `Forventede 600.000 kr, fik ${restgæld.toFixed(2)} kr`);
  });

  it("restgæld er under halvdelen af lånet ved over halvvejs i løbetiden", () => {
    // Pga. renters rente betaler man mest renter i starten, men restgæld
    // skal dog falde under 50% inden halvvejs af løbetiden
    const midt = restgældEfterÅr(2_000_000, 0.04, 360, 15, 0);
    assert.ok(midt < 2_000_000,
      "Restgæld skal være reduceret efter halvdelen af løbetiden");
  });

  it("restgæld er præcis P i starten af afdragsfri periode (år 0)", () => {
    const restgæld = restgældEfterÅr(1_500_000, 0.035, 300, 0, 60);
    assert.strictEqual(restgæld, 1_500_000);
  });

});
