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

const valgte = new Set();

function formatKr(amount) {
  return amount.toLocaleString("da-DK") + " kr.";
}

function render() {
  const grid = document.getElementById("compareGrid");
  const maxNået = valgte.size >= 3;

  grid.innerHTML = mockCases.map(c => {
    const erValgt = valgte.has(c.id);
    const erDisabled = maxNået && !erValgt;
    const cashflow = c.udlejning.udlejes
      ? c.udlejning.månedligLeje - c.udlejning.månedligUdgifter
      : null;

    return `
      <div class="compare-card${erValgt ? " compare-card--valgt" : ""}${erDisabled ? " compare-card--disabled" : ""}" data-id="${c.id}">
        <div class="compare-card__accent"></div>
        <div class="compare-card__body">
          ${erValgt ? '<span class="compare-card__check">✓</span>' : ""}
          <div class="compare-card__header">
            <h3 class="compare-card__navn">${c.navn}</h3>
            <p class="compare-card__adresse">${c.adresse}</p>
          </div>
          <div class="compare-card__chips">
            <span class="chip">${c.areal} m²</span>
            <span class="chip">${c.antalVærelser} værelser</span>
          </div>
          <div class="compare-card__tal">
            <div class="tal-row">
              <span class="tal-label">Købspris</span>
              <span class="tal-value">${formatKr(c.købspris)}</span>
            </div>
            <div class="tal-row">
              <span class="tal-label">Egenkapital</span>
              <span class="tal-value">${formatKr(c.egenkapital)}</span>
            </div>
            ${cashflow !== null ? `
            <div class="tal-row">
              <span class="tal-label">Cashflow/md.</span>
              <span class="tal-value ${cashflow >= 0 ? "pos" : "neg"}">${formatKr(cashflow)}</span>
            </div>` : ""}
          </div>
          <div class="compare-card__footer">
            <span class="compare-card__status">
              ${erValgt ? "Valgt ✓" : erDisabled ? "Max 3 valgt" : "Klik for at vælge"}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("valgAntal").textContent = `${valgte.size}/3 valgt`;
  document.getElementById("sammenlignBtn").disabled = valgte.size < 2;
}

function toggleValg(id) {
  if (valgte.has(id)) {
    valgte.delete(id);
  } else {
    if (valgte.size >= 3) return;
    valgte.add(id);
  }
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  render();

  document.getElementById("compareGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".compare-card");
    if (!card || card.classList.contains("compare-card--disabled")) return;
    toggleValg(Number(card.dataset.id));
  });

  document.getElementById("sammenlignBtn").addEventListener("click", () => {
    window.location.href = `/sammenlign.html?ids=${[...valgte].join(",")}`;
  });
});
