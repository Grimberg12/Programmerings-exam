"use strict";

const { beregnMånedligYdelse } = require("../../Frontend/js/beregninger");

describe("beregnMånedligYdelse", () => {

  test("beregner korrekt annuitetsydelse uden afdragsfri periode", () => {
    // 2.000.000 kr, 4% p.a., 30 år → typisk realkreditlån (~9.548 kr/md)
    const ydelse = beregnMånedligYdelse(2_000_000, 0.04, 360, 0);
    expect(ydelse).toBeGreaterThan(9_500);
    expect(ydelse).toBeLessThan(9_600);
  });

  test("ydelse er højere med afdragsfri periode (kortere amortiseringstid)", () => {
    const medAfdragsFri  = beregnMånedligYdelse(2_000_000, 0.04, 360, 120);
    const udenAfdragsFri = beregnMånedligYdelse(2_000_000, 0.04, 360, 0);
    expect(medAfdragsFri).toBeGreaterThan(udenAfdragsFri);
  });

  test("returnerer simpel deling ved nul-rente", () => {
    // 1.200.000 kr, 0% rente, 120 mdr → 10.000 kr/md
    const ydelse = beregnMånedligYdelse(1_200_000, 0, 120, 0);
    expect(Math.round(ydelse)).toBe(10_000);
  });

  test("returnerer 0 ved beløb på 0", () => {
    expect(beregnMånedligYdelse(0, 0.04, 360)).toBe(0);
  });

  test("returnerer 0 ved negativt beløb", () => {
    expect(beregnMånedligYdelse(-500_000, 0.04, 360)).toBe(0);
  });

  test("returnerer 0 ved løbetid på 0", () => {
    expect(beregnMånedligYdelse(1_000_000, 0.04, 0)).toBe(0);
  });

  test("returnerer kun renteydelse når afdragsfri periode er lig løbetid", () => {
    const ydelse    = beregnMånedligYdelse(1_000_000, 0.04, 120, 120);
    const forventet = 1_000_000 * (0.04 / 12);
    expect(ydelse).toBeCloseTo(forventet, 2);
  });

});
