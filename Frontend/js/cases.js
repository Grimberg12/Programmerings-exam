// Mock-data — samme som investeringscase.js, erstattes med API-kald
const mockCases = [
  {
    id: 1,
    oprettetDato: "2026-01-10",
    navn: "Lejlighed i København",
    beskrivelse: "En flot ejendom i København",
    adresse: "Rosenvængets Allé 2",
    areal: 120,
    antalVærelser: 3,
    købspris: 5000000,
    egenkapital: 1000000,
    udlejning: { udlejes: true, månedligLeje: 20000, månedligUdgifter: 5000 }
  },
  {
    id: 2,
    oprettetDato: "2026-02-20",
    navn: "Rækkehus i Aarhus",
    beskrivelse: "Rækkehus tæt på centrum",
    adresse: "Åboulevarden 45",
    areal: 145,
    antalVærelser: 4,
    købspris: 3200000,
    egenkapital: 640000,
    udlejning: { udlejes: true, månedligLeje: 14000, månedligUdgifter: 4000 }
  },
  {
    id: 3,
    oprettetDato: "2026-03-05",
    navn: "Villa i Odense",
    beskrivelse: "Stor villa med have",
    adresse: "Frederiksgade 8",
    areal: 210,
    antalVærelser: 6,
    købspris: 7500000,
    egenkapital: 1875000,
    udlejning: { udlejes: false, månedligLeje: 0, månedligUdgifter: 0 }
  }
];

function sorter(cases, valg) {
  const k = [...cases];
  if (valg === "dato")        return k.sort((a, b) => new Date(b.oprettetDato) - new Date(a.oprettetDato));
  if (valg === "adresse")     return k.sort((a, b) => a.adresse.localeCompare(b.adresse, "da"));
  if (valg === "pris-desc")   return k.sort((a, b) => b.købspris - a.købspris);
  if (valg === "pris-asc")    return k.sort((a, b) => a.købspris - b.købspris);
  if (valg === "egenkapital") return k.sort((a, b) => b.egenkapital - a.egenkapital);
  return k;
}

function render() {
  const valg = document.getElementById("sortSelect").value;
  const sorterede = sorter(mockCases, valg);
  const liste = document.getElementById("casesList");
  const antal = document.getElementById("casesAntal");

  antal.textContent = `${sorterede.length} case${sorterede.length !== 1 ? "s" : ""}`;

  liste.innerHTML = sorterede.map(c => {
    const dato = new Date(c.oprettetDato).toLocaleDateString("da-DK", {
      day: "numeric", month: "long", year: "numeric"
    });
    const cashflow = c.udlejning.udlejes
      ? c.udlejning.månedligLeje - c.udlejning.månedligUdgifter
      : null;

    return `
      <div class="case-row" onclick="window.location.href='/investeringscase.html?id=${c.id}'">
        <div class="case-row__main">
          <h3 class="case-row__navn">${c.navn}</h3>
          <p class="case-row__adresse">${c.adresse}</p>
        </div>
        <div class="case-row__tal">
          <div class="case-row__tal-item">
            <span class="case-row__label">Købspris</span>
            <span class="case-row__value">${c.købspris.toLocaleString("da-DK")} kr.</span>
          </div>
          <div class="case-row__tal-item">
            <span class="case-row__label">Egenkapital</span>
            <span class="case-row__value">${c.egenkapital.toLocaleString("da-DK")} kr.</span>
          </div>
          <div class="case-row__tal-item">
            <span class="case-row__label">Cashflow/md.</span>
            <span class="case-row__value ${cashflow === null ? "" : cashflow >= 0 ? "value-pos" : "value-neg"}">
              ${cashflow !== null ? cashflow.toLocaleString("da-DK") + " kr." : "—"}
            </span>
          </div>
        </div>
        <div class="case-row__meta">
          <span class="case-row__dato">Oprettet ${dato}</span>
          <a class="case-row__link" href="/investeringscase.html?id=${c.id}">Se detaljer →</a>
        </div>
      </div>`;
  }).join("");
}

document.getElementById("sortSelect").addEventListener("change", render);
render();
