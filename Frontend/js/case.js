const mockCases = [
  {
    id: 1,
    oprettetDato: "2026-01-10",
    navn: "Lejlighed i København",
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
    adresse: "Frederiksgade 8",
    areal: 210,
    antalVærelser: 6,
    købspris: 7500000,
    egenkapital: 1875000,
    udlejning: { udlejes: false, månedligLeje: 0, månedligUdgifter: 0 }
  }
];

// Spejl af mockProperties fra propertyGrid.js — til "Opret ny adresse"-knappens logik
const mockProperties = [
  { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }
];

function formatKr(amount) {
  return amount.toLocaleString("da-DK") + " kr.";
}

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

function render() {
  const valg = document.getElementById("sortSelect").value;
  const sorterede = sorter(mockCases, valg);
  const grid = document.getElementById("caseGrid");
  const emptyState = document.getElementById("emptyState");
  const caseCount = document.getElementById("caseCount");

  caseCount.textContent = `${sorterede.length} case${sorterede.length !== 1 ? "s" : ""}`;

  if (sorterede.length === 0) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  grid.innerHTML = sorterede.map(c => {
    const dato = new Date(c.oprettetDato).toLocaleDateString("da-DK", {
      day: "numeric", month: "short", year: "numeric"
    });

    const cashflow = c.udlejning.udlejes
      ? c.udlejning.månedligLeje - c.udlejning.månedligUdgifter
      : null;

    const cashflowHtml = cashflow !== null
      ? `<div class="tal-row">
           <span class="tal-label">Cashflow/md.</span>
           <span class="tal-value ${cashflow >= 0 ? "pos" : "neg"}">${formatKr(cashflow)}</span>
         </div>`
      : "";

    return `
      <div class="case-card" onclick="window.location.href='/investeringscase.html?id=${c.id}'">
        <div class="case-card__accent"></div>
        <div class="case-card__body">
          <div class="case-card__header">
            <h3 class="case-card__navn">${c.navn}</h3>
            <p class="case-card__adresse">${c.adresse}</p>
          </div>
          <div class="case-card__chips">
            <span class="chip">${c.areal} m²</span>
            <span class="chip">${c.antalVærelser} værelser</span>
          </div>
          <div class="case-card__tal">
            <div class="tal-row">
              <span class="tal-label">Købspris</span>
              <span class="tal-value">${formatKr(c.købspris)}</span>
            </div>
            <div class="tal-row">
              <span class="tal-label">Egenkapital</span>
              <span class="tal-value">${formatKr(c.egenkapital)}</span>
            </div>
            ${cashflowHtml}
          </div>
          <div class="case-card__footer">
            <span class="case-card__dato">Oprettet ${dato}</span>
            <span class="case-card__link">Se detaljer →</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function handleOpretAdresse() {
  if (mockProperties.length === 0) {
    window.location.href = "/index.html";
  } else if (mockProperties.length === 1) {
    window.location.href = `/ejendom.html?id=${mockProperties[0].id}`;
  } else {
    window.location.href = "/index.html?scroll=properties";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  document.getElementById("sortSelect").addEventListener("change", render);
  document.getElementById("opretAdresseBtn").addEventListener("click", handleOpretAdresse);
});
