"use strict";

// Isomorphic modul: virker både i browser (window.Beregninger) og Node.js (module.exports).
// Bruges af investeringscase.js, sammenlign.js og Backend/tests/*.test.js.
(function (global) {

  // rente: årsrente som decimal (fx 0.035 for 3,5%)
  // løbetidMdr: samlet løbetid i MÅNEDER (inkl. afdragsfri periode)
  // afdragsFriMdr: antal måneder med kun rentebetalinger (0 = ingen)
  function beregnMånedligYdelse(beløb, rente, løbetidMdr, afdragsFriMdr = 0) {
    if (!beløb || beløb <= 0 || !løbetidMdr || løbetidMdr <= 0) return 0;
    const i        = rente / 12;
    const amortMdr = løbetidMdr - afdragsFriMdr;
    if (amortMdr <= 0) return i === 0 ? 0 : beløb * i;
    if (i === 0)       return beløb / amortMdr;
    return beløb * i / (1 - Math.pow(1 + i, -amortMdr));
  }

  function beregnRenteYdelse(beløb, rente) {
    return beløb * (rente / 12);
  }

  // Restgæld efter k hele år.
  // Under afdragsfri periode forbliver gælden uændret (kun renter betales).
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

  const exports = { beregnMånedligYdelse, beregnRenteYdelse, restgældEfterÅr };

  // Node.js
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
  } else {
    // Browser
    global.Beregninger = exports;
  }

}(typeof globalThis !== "undefined" ? globalThis : this));
