"use strict";

let alleCases = [];

async function hentCases() {
  const savedUser = localStorage.getItem("loggedInUser");
  if (!savedUser) { window.location.href = "/login.html"; return []; }

  const user     = JSON.parse(savedUser);
  const response = await fetch(`/api/v1/users/${user.brugerID}/investment-cases`);
  const result   = await response.json();
  if (!response.ok) return [];

  return result.data.map(c => ({
    id:          Number(c.id),
    oprettetDato: c.datoOprettet,
    navn:        c.navn,
    beskrivelse: c.beskrivelse,
    adresse:     `${c.vejNavn} ${c.vejNummer}, ${c.postnummer} ${c.bynavn}`,
    areal:       Number(c.areal || 0),
    antalVærelser: Number(c.antalVaerelser || 0),
    købspris:    Number(c.koebsPris || 0),
    egenkapital: Number(c.egenKapital || 0),
    udlejning: {
      udlejes:          Boolean(c.erLejeBolig),
      månedligLeje:     Number(c.lejeIndkomst || 0),
      månedligUdgifter: Number(c.lejeUdgifter || 0)
    }
  }));
}

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
  const valg     = document.getElementById("sortSelect").value;
  const sorterede = sorter(alleCases, valg);
  const liste    = document.getElementById("casesList");
  const antal    = document.getElementById("casesAntal");

  antal.textContent = `${sorterede.length} case${sorterede.length !== 1 ? "s" : ""}`;

  if (sorterede.length === 0) {
    liste.innerHTML = `<p style="text-align:center;color:var(--muted-text);padding:40px 0;">
      Du har ingen investeringscases endnu. Opret en via en ejendomsprofil.
    </p>`;
    return;
  }

  liste.innerHTML = sorterede.map(c => {
    const dato     = new Date(c.oprettetDato).toLocaleDateString("da-DK", {
      day: "numeric", month: "long", year: "numeric"
    });
    const cashflow = c.udlejning.udlejes
      ? c.udlejning.månedligLeje - c.udlejning.månedligUdgifter
      : null;
    const cfKlasse = cashflow === null ? "" : cashflow >= 0 ? "value-pos" : "value-neg";

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
            <span class="case-row__value ${cfKlasse}">
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

document.addEventListener("DOMContentLoaded", async () => {
  alleCases = await hentCases();
  render();
  document.getElementById("sortSelect").addEventListener("change", render);
});
