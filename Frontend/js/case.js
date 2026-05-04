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
    oprettetDato: c.datoOprettet,
    ændretDato: c.datoAendret,
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

async function sletCase(id) {
  const bekraeft = confirm("Er du sikker på, at du vil slette denne investeringscase?");

  if (!bekraeft) return;

  const response = await fetch(`/api/v1/investment-cases/${id}`, {
    method: "DELETE"
  });

  const result = await response.json();

  if (!response.ok) {
    alert(result.message || "Kunne ikke slette case.");
    return;
  }

  alert("Investeringscase slettet.");
  render();
}

async function duplikerCase(id) {
  const bekraeft = confirm("Vil du duplikere denne investeringscase?");

  if (!bekraeft) return;

  try {
    const response = await fetch(`/api/v1/investment-cases/${id}/duplicate`, {
      method: "POST"
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Kunne ikke duplikere case.");
      return;
    }

    const nyCaseId = result.data.investeringsCaseID;

    alert("Casen er duplikeret. Du åbner nu kopien.");
    window.location.href = `/investeringscase.html?id=${nyCaseId}`;
  } catch (error) {
    console.error("Fejl ved duplikering:", error);
    alert("Kunne ikke forbinde til serveren.");
  }
}

function formatKr(amount) {
  return amount.toLocaleString("da-DK") + " kr.";
}

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

async function render() {
  const valg = document.getElementById("sortSelect").value;
  const cases = await hentCases();
  const sorterede = sorter(cases, valg);
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

    const ændretDato = c.ændretDato ? new Date(c.ændretDato).toLocaleDateString("da-DK", {
      day: "numeric", month: "short", year: "numeric"
    }) : null;

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

      <div class="case-card__actions">
        <span class="case-card__link">Se detaljer</span>

        <button 
          class="duplicate-case-btn"
          onclick="event.stopPropagation(); duplikerCase(${c.id});"
        >
          Dupliker
        </button>

        <button 
          class="delete-case-btn"
          onclick="event.stopPropagation(); sletCase(${c.id});"
        >
          Slet
        </button>
      </div>
      </div>
    </div>
  </div>
`;
  }).join("");
}

function handleOpretAdresse() {
  window.location.href = "/index.html?scroll=properties";
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  document.getElementById("sortSelect").addEventListener("change", render);
  document.getElementById("opretAdresseBtn").addEventListener("click", handleOpretAdresse);
});
