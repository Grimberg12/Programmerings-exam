"use strict";

const { restgældEfterÅr } = require("../../Frontend/js/beregninger");

describe("restgældEfterÅr", () => {

  test("restgæld er uændret i afdragsfri periode", () => {
    // 10 års afdragsfri → efter år 5 er gælden stadig 2.000.000
    const restgæld = restgældEfterÅr(2_000_000, 0.04, 360, 5, 120);
    expect(restgæld).toBe(2_000_000);
  });

  test("restgæld er 0 når lånet er fuldt tilbagebetalt", () => {
    const restgæld = restgældEfterÅr(2_000_000, 0.04, 360, 30, 0);
    expect(restgæld).toBe(0);
  });

  test("restgæld er 0 efter lånets løbetid er overskredet", () => {
    const restgæld = restgældEfterÅr(2_000_000, 0.04, 360, 35, 0);
    expect(restgæld).toBe(0);
  });

  test("restgæld falder over tid (afbetaling sker)", () => {
    const efter10 = restgældEfterÅr(2_000_000, 0.04, 360, 10, 0);
    const efter20 = restgældEfterÅr(2_000_000, 0.04, 360, 20, 0);
    expect(efter10).toBeGreaterThan(efter20);
  });

  test("restgæld er lineær ved nul-rente", () => {
    // 1.200.000 kr, 0% rente, 120 mdr → efter 5 år: præcis 600.000
    const restgæld = restgældEfterÅr(1_200_000, 0, 120, 5, 0);
    expect(restgæld).toBeCloseTo(600_000, 2);
  });

  test("restgæld er reduceret efter halvdelen af løbetiden", () => {
    const midt = restgældEfterÅr(2_000_000, 0.04, 360, 15, 0);
    expect(midt).toBeLessThan(2_000_000);
  });

  test("restgæld er præcis P ved år 0 med afdragsfri periode", () => {
    const restgæld = restgældEfterÅr(1_500_000, 0.035, 300, 0, 60);
    expect(restgæld).toBe(1_500_000);
  });

});
