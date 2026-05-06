"use strict";

function sorter(cases, valg) {
  const k = [...cases];
  if (valg === "dato-desc")   return k.sort((a, b) => new Date(b.oprettetDato) - new Date(a.oprettetDato));
  if (valg === "dato-asc")    return k.sort((a, b) => new Date(a.oprettetDato) - new Date(b.oprettetDato));
  if (valg === "adresse")     return k.sort((a, b) => a.adresse.localeCompare(b.adresse, "da"));
  if (valg === "pris-desc")   return k.sort((a, b) => b.købspris - a.købspris);
  if (valg === "pris-asc")    return k.sort((a, b) => a.købspris - b.købspris);
  if (valg === "egenkapital") return k.sort((a, b) => b.egenkapital - a.egenkapital);
  if (valg === "areal-desc")  return k.sort((a, b) => b.areal - a.areal);
  return k;
}

const cases = [
  { id: 1, oprettetDato: "2024-01-15", adresse: "Ørstedsvej 10, 2000 Frederiksberg", købspris: 3_000_000, egenkapital: 500_000, areal: 80 },
  { id: 2, oprettetDato: "2025-06-01", adresse: "Ågade 5, 2200 København N",          købspris: 1_500_000, egenkapital: 800_000, areal: 55 },
  { id: 3, oprettetDato: "2023-11-20", adresse: "Amagerbrogade 22, 2300 København S", købspris: 2_200_000, egenkapital: 300_000, areal: 70 },
];

describe("sorter", () => {

  test("sorterer nyest dato først (dato-desc)", () => {
    const result = sorter(cases, "dato-desc");
    expect(result[0].id).toBe(2);
    expect(result[2].id).toBe(3);
  });

  test("sorterer ældste dato først (dato-asc)", () => {
    const result = sorter(cases, "dato-asc");
    expect(result[0].id).toBe(3);
    expect(result[2].id).toBe(2);
  });

  test("sorterer højeste pris først (pris-desc)", () => {
    const result = sorter(cases, "pris-desc");
    expect(result[0].id).toBe(1);
    expect(result[2].id).toBe(2);
  });

  test("sorterer laveste pris først (pris-asc)", () => {
    const result = sorter(cases, "pris-asc");
    expect(result[0].id).toBe(2);
    expect(result[2].id).toBe(1);
  });

  test("sorterer højeste egenkapital først", () => {
    const result = sorter(cases, "egenkapital");
    expect(result[0].id).toBe(2);
  });

  test("sorterer største areal først (areal-desc)", () => {
    const result = sorter(cases, "areal-desc");
    expect(result[0].id).toBe(1);
    expect(result[2].id).toBe(2);
  });

  test("sorterer adresse korrekt med dansk alfabetsortering", () => {
    // Dansk alfabet: A-Z, Æ, Ø, Å — Ø (28.) kommer FØR Å (29.)
    const result = sorter(cases, "adresse");
    expect(result[0].id).toBe(3); // Amagerbrogade (A)
    expect(result[1].id).toBe(1); // Ørstedsvej (Ø)
    expect(result[2].id).toBe(2); // Ågade (Å)
  });

  test("returnerer uændret rækkefølge ved ukendt sorteringsvalg", () => {
    const result = sorter(cases, "ukendt-valg");
    expect(result[0].id).toBe(cases[0].id);
    expect(result[1].id).toBe(cases[1].id);
    expect(result[2].id).toBe(cases[2].id);
  });

  test("muterer ikke det originale array", () => {
    const originalFørste = cases[0].id;
    sorter(cases, "pris-desc");
    expect(cases[0].id).toBe(originalFørste);
  });

  test("håndterer tomt array uden fejl", () => {
    const result = sorter([], "pris-desc");
    expect(result).toEqual([]);
  });

});
