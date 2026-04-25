async function hentCases() {
  const savedUser = localStorage.getItem("loggedInUser");

  if (!savedUser) {
    window.location.href = "/login.html";
    return [];
  }

  const user = JSON.parse(savedUser);

  const response = await fetch(`/api/v1/users/${user.brugerID}/investment-cases`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Kunne ikke hente cases");
  }

  return result.data.map(c => ({
    id: c.id,
    oprettetDato: c.oprettetDato,
    navn: c.navn,
    adresse: `${c.vejNavn} ${c.vejNummer}, ${c.postnummer} ${c.bynavn}`,
    areal: Number(c.areal || 0),
    antalVærelser: c.antalVaerelser || 0,
    købspris: Number(c.koebsPris || 0),
    egenkapital: Number(c.egenKapital || 0),
    udlejning: {
      udlejes: Boolean(c.erLejeBolig),
      månedligLeje: Number(c.lejeIndkomst || 0),
      månedligUdgifter: Number(c.lejeUdgifter || 0)
    }
  }));
}

const valgte = new Set();

function formatKr(amount) {
  return amount.toLocaleString("da-DK") + " kr.";
}

async function render() {
  const grid = document.getElementById("compareGrid");
  const maxNået = valgte.size >= 3;

  const cases = await hentCases();
  grid.innerHTML = cases.map(c => {
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
