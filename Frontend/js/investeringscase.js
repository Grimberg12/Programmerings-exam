let caseData = null;

async function hentCase() {
  const savedUser = localStorage.getItem("loggedInUser");
  const user = JSON.parse(savedUser);

  const urlId = Number(new URLSearchParams(window.location.search).get("id"));

  const response = await fetch(`/api/v1/users/${user.brugerID}/investment-cases`);
  const result = await response.json();

  const fundetCase = result.data.find(c => Number(c.id) === urlId);

  return {
    id: Number(fundetCase.id),
    ejendomsProfilID: Number(fundetCase.ejendomsProfilID),
    oprettetDato: fundetCase.datoOprettet,
    navn: fundetCase.navn,
    beskrivelse: fundetCase.beskrivelse,
    adresse: `${fundetCase.vejNavn} ${fundetCase.vejNummer}, ${fundetCase.postnummer} ${fundetCase.bynavn}`,
    areal: Number(fundetCase.areal || 0),
    antalVærelser: Number(fundetCase.antalVaerelser || 0),
    købspris: Number(fundetCase.koebsPris || 0),
    egenkapital: Number(fundetCase.egenKapital || 0),
    advokat: Number(fundetCase.advokat || 0),
    tinglysning: Number(fundetCase.tinglysning || 0),
    koeberRaadgivning: Number(fundetCase.koeberRaadgivning || 0),
    andre_omkostninger: Number(fundetCase.andreOmkostninger || 0),
    renoveringsomkostninger: Number(fundetCase.renoveringsomkostninger || 0),
    realkreditlån: null,
    banklån: null,
    andrelån: null,
    udlejning: {
      udlejes: Boolean(fundetCase.erLejeBolig),
      månedligLeje: Number(fundetCase.lejeIndkomst || 0),
      månedligUdgifter: Number(fundetCase.lejeUdgifter || 0)
    }
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  caseData = await hentCase();

  renderInvestmentCaseDetails();

  const calculateBtn = document.getElementById("calculateBtn");
  const hideBtn = document.getElementById("hideBtn");
  const sim30Btn = document.getElementById("sim30Btn");

  calculateBtn.addEventListener("click", () => {
    const result = document.getElementById("simulationResult");
    result.innerHTML = renderSimulationTabel();
    result.style.display = "block";
    hideBtn.style.display = "block";
  });

  hideBtn.addEventListener("click", () => {
    const result = document.getElementById("simulationResult");
    result.innerHTML = "";
    result.style.display = "none";
    hideBtn.style.display = "none";
  });

  sim30Btn.addEventListener("click", () => {
    const result = document.getElementById("sim30Result");

    if (result.innerHTML) {
      result.innerHTML = "";
      result.style.display = "none";
      sim30Btn.textContent = "Simuler over 30 år";
    } else {
      result.innerHTML = render30ÅrTabel();
      result.style.display = "block";
      sim30Btn.textContent = "Skjul 30-årig simulering";
    }
  });
});


// ── Detaljer ─────────────────────────────────────────────────

function renderInvestmentCaseDetails() {
  const container = document.getElementById("investmentCaseDetails");
  const hasFinancing = caseData.realkreditlån || caseData.banklån || caseData.andrelån;

  container.innerHTML = `
    <button class="edit-case-btn" id="editCaseBtn" title="Rediger case">✏️</button>
    <h2>${caseData.navn}</h2>
    <p>${caseData.beskrivelse}</p>
    <p>Adresse: ${caseData.adresse}</p>
    <p>Areal: ${caseData.areal} m²</p>
    <p>Antal værelser: ${caseData.antalVærelser}</p>
    <p>Købspris: ${caseData.købspris.toLocaleString("da-DK")} kr.</p>
    <p>Egenkapital: ${caseData.egenkapital.toLocaleString("da-DK")} kr.</p>
    <p>Advokat: ${caseData.advokat.toLocaleString("da-DK")} kr.</p>
    <p>Tinglysning: ${caseData.tinglysning.toLocaleString("da-DK")} kr.</p>
    <p>Køberrådgivning: ${caseData.koeberRaadgivning.toLocaleString("da-DK")} kr.</p>
    <p>Andre omkostninger: ${caseData.andre_omkostninger.toLocaleString("da-DK")} kr.</p>
    <p>Renoveringsomkostninger: ${caseData.renoveringsomkostninger.toLocaleString("da-DK")} kr.</p>

    ${hasFinancing ? `
    <h3>Finansiering</h3>
    ${caseData.realkreditlån ? `<p>Realkreditlån: ${caseData.realkreditlån.beløb.toLocaleString("da-DK")} kr. (${caseData.realkreditlån.type}, ${caseData.realkreditlån.rente * 100}%, ${caseData.realkreditlån.løbetid} år)</p>` : ""}
    ${caseData.banklån      ? `<p>Banklån: ${caseData.banklån.beløb.toLocaleString("da-DK")} kr. (${caseData.banklån.type}, ${caseData.banklån.rente * 100}%, ${caseData.banklån.løbetid} år)</p>` : ""}
    ${caseData.andrelån     ? `<p>Andre lån: ${caseData.andrelån.beløb.toLocaleString("da-DK")} kr. (${caseData.andrelån.type}, ${caseData.andrelån.rente * 100}%, ${caseData.andrelån.løbetid} år)</p>` : ""}
    ` : ""}

    ${caseData.udlejning.udlejes ? `
    <h3>Udlejning</h3>
    <p>Udlejes: Ja</p>
    <p>Månedlig leje: ${caseData.udlejning.månedligLeje.toLocaleString("da-DK")} kr.</p>
    <p>Månedlige udgifter: ${caseData.udlejning.månedligUdgifter.toLocaleString("da-DK")} kr.</p>
    ` : "<h3>Udlejning</h3><p>Ejendommen udlejes ikke.</p>"}`;

  document.getElementById("editCaseBtn").addEventListener("click", () => {
    localStorage.setItem("editCase", JSON.stringify(caseData));
    window.location.href = `/ejendom.html?id=${caseData.ejendomsProfilID}`;
  });
}

renderInvestmentCaseDetails();

// ── Simulering (samlet skema) ─────────────────────────────────

function renderSimulationTabel() {
  const månedligLeje      = caseData.udlejning.månedligLeje;
  const månedligeUdgifter = caseData.udlejning.månedligUdgifter;
  const månedligtCashflow = månedligLeje - månedligeUdgifter;
  const årligtCashflow    = månedligtCashflow * 12;

  const totalGæld          = (caseData.realkreditlån?.beløb || 0) + (caseData.banklån?.beløb || 0) + (caseData.andrelån?.beløb || 0);
  const gældsgrad          = totalGæld / caseData.købspris;
  const gældsgradPct       = gældsgrad * 100;
  const egenkapitalBeregnet = caseData.købspris - totalGæld;

  const ekfMånedlig  = månedligtCashflow / caseData.egenkapital;
  const ekfÅrlig     = ekfMånedlig * 12;
  const ekfÅrligPct  = ekfÅrlig * 100;

  const cfStatus  = månedligtCashflow > 0 ? "god" : "dårlig";
  const ekfStatus = ekfÅrligPct > 8 ? "god" : ekfÅrligPct > 3 ? "neutral" : "dårlig";
  const gdStatus  = gældsgradPct < 60 ? "god" : gældsgradPct < 80 ? "neutral" : "dårlig";
  const vurderingStatus = månedligtCashflow > 0 && ekfÅrligPct > 5 ? "god"
    : månedligtCashflow > 0 ? "neutral" : "dårlig";
  const vurdering = { god: "God investering", neutral: "Neutral investering", dårlig: "Dårlig investering" }[vurderingStatus];

  const kr    = v => v.toLocaleString("da-DK") + " kr.";
  const pct   = v => (v * 100).toFixed(2) + "%";
  const badge = s => `<span class="status-badge status-${s}">${{ god: "God", neutral: "Neutral", dårlig: "Dårlig" }[s]}</span>`;
  const tt    = text => `<span class="tooltip">ℹ️<span class="tooltip-text">${text}</span></span>`;

  function sektionRow(titel) {
    return `<tr class="section-row"><td colspan="2">${titel}</td></tr>`;
  }

  function row(label, value, tooltipText) {
    return `<tr>
      <td class="row-label">${label}</td>
      <td class="sim-value-cell">${value}${tooltipText ? " " + tt(tooltipText) : ""}</td>
    </tr>`;
  }

  return `
    <div class="sim-wrapper">
      <table class="sammenlign-tabel">
        <thead>
          <tr>
            <th class="label-col">Beregning</th>
            <th>Resultat</th>
          </tr>
        </thead>
        <tbody>
          ${sektionRow("Cashflow")}
          ${row("Månedligt cashflow", kr(månedligtCashflow),
            `Månedlig leje (${kr(månedligLeje)}) − udgifter (${kr(månedligeUdgifter)}) = ${kr(månedligtCashflow)}`)}
          ${row("Årligt cashflow", kr(årligtCashflow),
            `Månedligt cashflow × 12 = ${kr(årligtCashflow)}`)}

          ${sektionRow("Egenkapital")}
          ${row("Egenkapital (beregnet)", kr(egenkapitalBeregnet),
            `Købspris − total gæld = ${kr(egenkapitalBeregnet)}`)}
          ${row("Egenkapitalforrentning/md.", pct(ekfMånedlig),
            `Cashflow / egenkapital (${kr(caseData.egenkapital)})`)}
          ${row("Egenkapitalforrentning/år", pct(ekfÅrlig),
            "Månedlig forrentning × 12")}

          ${sektionRow("Gæld")}
          ${row("Gældsgrad", pct(gældsgrad),
            `Total gæld (${kr(totalGæld)}) / købspris (${kr(caseData.købspris)})`)}

          ${caseData.udlejning.udlejes ? `
          ${sektionRow("Udlejning")}
          ${row("Udlejningsindtægt/md.", kr(månedligLeje), "Månedlig lejeindtægt fra udlejning")}
          ${row("Udlejningsindtægt/år",  kr(månedligLeje * 12), "Månedlig leje × 12")}
          ${row("Udlejningsudgift/md.",  kr(månedligeUdgifter), "Månedlige driftsudgifter")}
          ${row("Udlejningsudgift/år",   kr(månedligeUdgifter * 12), "Månedlige udgifter × 12")}
          ` : ""}

          ${sektionRow("Samlet vurdering")}
          <tr>
            <td class="row-label">Overordnet vurdering</td>
            <td class="sim-value-cell">
              <span class="status-badge status-${vurderingStatus}">${vurdering}</span>
            </td>
          </tr>
          <tr>
            <td class="row-label">Cashflow</td>
            <td class="sim-value-cell">
              ${badge(cfStatus)}
              <span class="vurdering-tekst">${månedligtCashflow > 0
                ? `Positivt cashflow på ${kr(månedligtCashflow)}/md.`
                : `Negativt cashflow på ${kr(månedligtCashflow)}/md.`}</span>
            </td>
          </tr>
          <tr>
            <td class="row-label">Egenkapitalforrentning</td>
            <td class="sim-value-cell">
              ${badge(ekfStatus)}
              <span class="vurdering-tekst">Årlig: ${ekfÅrligPct.toFixed(2)}% — ${
                ekfStatus === "god"     ? "over 8%, stærkt afkast."
                : ekfStatus === "neutral" ? "3–8%, moderat afkast."
                : "under 3%, lavt afkast."}</span>
            </td>
          </tr>
          <tr>
            <td class="row-label">Gældsgrad</td>
            <td class="sim-value-cell">
              ${badge(gdStatus)}
              <span class="vurdering-tekst">${gældsgradPct.toFixed(2)}% — ${
                gdStatus === "god"     ? "under 60%, solid egenfinansiering."
                : gdStatus === "neutral" ? "60–80%, acceptabelt niveau."
                : "over 80%, høj belåning."}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// ── Knapper ──────────────────────────────────────────────────

document.getElementById("calculateBtn").addEventListener("click", () => {
  const result = document.getElementById("simulationResult");
  result.innerHTML = renderSimulationTabel();
  result.style.display = "block";
  document.getElementById("hideBtn").style.display = "block";
});

document.getElementById("hideBtn").addEventListener("click", () => {
  const result = document.getElementById("simulationResult");
  result.innerHTML = "";
  result.style.display = "none";
  document.getElementById("hideBtn").style.display = "none";
});

// ── 30-årig simulering ───────────────────────────────────────

// Annuitetslån: restgæld efter et givet antal år
function restgældEfterÅr(P, rente, løbetidÅr, år) {
  if (år >= løbetidÅr) return 0;
  const i = rente / 12;
  const N = løbetidÅr * 12;
  const k = år * 12;
  if (i === 0) return P * (1 - k / N);
  const M = P * i / (1 - Math.pow(1 + i, -N));
  return Math.max(0, P * Math.pow(1 + i, k) - M * (Math.pow(1 + i, k) - 1) / i);
}

function render30ÅrTabel() {
  const månedligtCashflow = caseData.udlejning.udlejes
    ? caseData.udlejning.månedligLeje - caseData.udlejning.månedligUdgifter
    : 0;
  const cashflowÅr = månedligtCashflow * 12;
  const kr = v => Math.round(v).toLocaleString("da-DK") + " kr.";

  let rækker = "";
  let akkumuleret = 0;

  for (let år = 1; år <= 30; år++) {
    akkumuleret += cashflowÅr;

    let restgæld = 0;
    for (const lån of [caseData.realkreditlån, caseData.banklån, caseData.andrelån]) {
      if (lån) restgæld += restgældEfterÅr(lån.beløb, lån.rente, lån.løbetid, år);
    }

    const egenkapital = caseData.købspris - restgæld;
    const erMilepæl = år % 5 === 0;

    rækker += `<tr class="${erMilepæl ? "sim30-milepæl" : ""}">
      <td class="row-label">${år}</td>
      <td>${kr(cashflowÅr)}</td>
      <td>${kr(akkumuleret)}</td>
      <td>${kr(restgæld)}</td>
      <td>${kr(egenkapital)}</td>
    </tr>`;
  }

  return `
    <div class="sim-wrapper" style="margin-top:24px;">
      <table class="sammenlign-tabel">
        <thead>
          <tr>
            <th class="label-col">År</th>
            <th>Cashflow / år</th>
            <th>Akkumuleret cashflow</th>
            <th>Restgæld</th>
            <th>Egenkapital</th>
          </tr>
        </thead>
        <tbody>${rækker}</tbody>
      </table>
    </div>`;
}

document.getElementById("sim30Btn").addEventListener("click", () => {
  const result = document.getElementById("sim30Result");
  const btn    = document.getElementById("sim30Btn");
  if (result.innerHTML) {
    result.innerHTML = "";
    result.style.display = "none";
    btn.textContent = "Simuler over 30 år";
  } else {
    result.innerHTML = render30ÅrTabel();
    result.style.display = "block";
    btn.textContent = "Skjul 30-årig simulering";
  }
});
