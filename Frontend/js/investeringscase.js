const mockCases = [
  {
    id: 1,
    ejendomsProfilID: 1,
    oprettetDato: "2026-01-10",
    navn: "Lejlighed i København",
    beskrivelse: "En flot ejendom i København",
    adresse: "Rosenvængets Allé 2",
    areal: 120,
    antalVærelser: 3,
    købspris: 5000000,
    egenkapital: 1000000,
    andre_omkostninger: 50000,
    renoveringsomkostninger: 200000,
    realkreditlån: { beløb: 4000000, type: "fast",     rente: 0.02,  løbetid: 30 },
    banklån:       { beløb: 500000,  type: "variabel", rente: 0.05,  løbetid: 10 },
    andrelån:      { beløb: 500000,  type: "variabel", rente: 0.05,  løbetid: 10 },
    udlejning: { udlejes: true, månedligLeje: 20000, månedligUdgifter: 5000 }
  },
  {
    id: 2,
    ejendomsProfilID: 2,
    oprettetDato: "2026-02-20",
    navn: "Rækkehus i Aarhus",
    beskrivelse: "Rækkehus tæt på centrum",
    adresse: "Åboulevarden 45",
    areal: 145,
    antalVærelser: 4,
    købspris: 3200000,
    egenkapital: 640000,
    andre_omkostninger: 30000,
    renoveringsomkostninger: 80000,
    realkreditlån: { beløb: 2560000, type: "fast", rente: 0.03, løbetid: 30 },
    banklån: null,
    andrelån: null,
    udlejning: { udlejes: true, månedligLeje: 14000, månedligUdgifter: 4000 }
  },
  {
    id: 3,
    ejendomsProfilID: 3,
    oprettetDato: "2026-03-05",
    navn: "Villa i Odense",
    beskrivelse: "Stor villa med have",
    adresse: "Frederiksgade 8",
    areal: 210,
    antalVærelser: 6,
    købspris: 7500000,
    egenkapital: 1875000,
    andre_omkostninger: 75000,
    renoveringsomkostninger: 350000,
    realkreditlån: { beløb: 5625000, type: "variabel", rente: 0.025, løbetid: 30 },
    banklån:       { beløb: 500000,  type: "fast",     rente: 0.045, løbetid: 15 },
    andrelån: null,
    udlejning: { udlejes: false, månedligLeje: 0, månedligUdgifter: 0 }
  }
];

// Opdater mock-data hvis bruger kommer fra redigering
const updatedCaseRaw = localStorage.getItem("updatedCase");
if (updatedCaseRaw) {
  const updated = JSON.parse(updatedCaseRaw);
  localStorage.removeItem("updatedCase");
  const idx = mockCases.findIndex(c => c.id === updated.id);
  if (idx !== -1) mockCases[idx] = updated;
}

// Vælg case ud fra URL-parameter, fallback til første
const urlId = Number(new URLSearchParams(window.location.search).get("id"));
const caseData = mockCases.find(c => c.id === urlId) || mockCases[0];

// ── Detaljer ────────────────────────────────────────────────

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

// ── Simulering ──────────────────────────────────────────────

function calculateCashflow() {
  const månedligLeje = caseData.udlejning.månedligLeje;
  const månedligeUdgifter = caseData.udlejning.månedligUdgifter;
  const månedligtCashflow = månedligLeje - månedligeUdgifter;
  const årligtCashflow = månedligtCashflow * 12;

  const el = document.getElementById("cashflowResult");
  el.style.display = "block";
  el.innerHTML = `<div><h3>Cashflow</h3>
    <div class="cashflow-item">
      <p>Månedligt cashflow: ${månedligtCashflow.toLocaleString("da-DK")} kr.</p>
      <span class="tooltip">ℹ️<span class="tooltip-text">Månedlig leje (${månedligLeje.toLocaleString("da-DK")}) − udgifter (${månedligeUdgifter.toLocaleString("da-DK")}) = ${månedligtCashflow.toLocaleString("da-DK")} kr.</span></span>
    </div>
    <div class="cashflow-item">
      <p>Årligt cashflow: ${årligtCashflow.toLocaleString("da-DK")} kr.</p>
      <span class="tooltip">ℹ️<span class="tooltip-text">Månedligt cashflow × 12 = ${årligtCashflow.toLocaleString("da-DK")} kr.</span></span>
    </div>
  </div>`;
}

function calculateEgenkapitalforrentning() {
  const månedlig = (caseData.udlejning.månedligLeje - caseData.udlejning.månedligUdgifter) / caseData.egenkapital;
  const årlig = månedlig * 12;
  const el = document.getElementById("egenkapitalforrentningResult");
  el.style.display = "block";
  el.innerHTML = `<div><h3>Egenkapitalforrentning</h3>
    <div class="egenkapitalforrentning-item">
      <p>Månedlig: ${(månedlig * 100).toFixed(2)}%</p>
      <span class="tooltip">ℹ️<span class="tooltip-text">Cashflow / egenkapital (${caseData.egenkapital.toLocaleString("da-DK")} kr.)</span></span>
    </div>
    <div class="egenkapitalforrentning-item">
      <p>Årlig: ${(årlig * 100).toFixed(2)}%</p>
      <span class="tooltip">ℹ️<span class="tooltip-text">Månedlig forrentning × 12</span></span>
    </div>
  </div>`;
}

function calculateGældsgrad() {
  const totalGæld = (caseData.realkreditlån?.beløb || 0) + (caseData.banklån?.beløb || 0) + (caseData.andrelån?.beløb || 0);
  const gældsgrad = totalGæld / caseData.købspris;
  const el = document.getElementById("gældsgradResult");
  el.style.display = "block";
  el.innerHTML = `<div><h3>Gældsgrad</h3>
    <div class="gældsgrad-item">
      <p>Gældsgrad: ${(gældsgrad * 100).toFixed(2)}%</p>
      <span class="tooltip">ℹ️<span class="tooltip-text">Total gæld (${totalGæld.toLocaleString("da-DK")} kr.) / købspris (${caseData.købspris.toLocaleString("da-DK")} kr.)</span></span>
    </div>
  </div>`;
}

function calculateEgenkapital() {
  const totalGæld = (caseData.realkreditlån?.beløb || 0) + (caseData.banklån?.beløb || 0) + (caseData.andrelån?.beløb || 0);
  const egenkapital = caseData.købspris - totalGæld;
  const el = document.getElementById("egenkapitalResult");
  el.style.display = "block";
  el.innerHTML = `<div><h3>Egenkapital</h3>
    <div class="egenkapital-item">
      <p>Egenkapital: ${egenkapital.toLocaleString("da-DK")} kr.</p>
      <span class="tooltip">ℹ️<span class="tooltip-text">Købspris − total gæld = ${egenkapital.toLocaleString("da-DK")} kr.</span></span>
    </div>
  </div>`;
}

function calculateUdlejningsindtægter() {
  const månedlig = caseData.udlejning.månedligLeje;
  const el = document.getElementById("udlejningsindtægterResult");
  el.style.display = "block";
  el.innerHTML = `<div><h3>Udlejningsindtægter</h3>
    <div class="udlejningsindtægter-item">
      <p>Månedligt: ${månedlig.toLocaleString("da-DK")} kr.</p>
      <span class="tooltip">ℹ️<span class="tooltip-text">Månedlig lejeindtægt fra udlejning</span></span>
    </div>
    <div class="udlejningsindtægter-item">
      <p>Årligt: ${(månedlig * 12).toLocaleString("da-DK")} kr.</p>
      <span class="tooltip">ℹ️<span class="tooltip-text">Månedlig leje × 12</span></span>
    </div>
  </div>`;
}

function calculateUdlejningsudgifter() {
  const månedlig = caseData.udlejning.månedligUdgifter;
  const el = document.getElementById("udlejningsudgifterResult");
  el.style.display = "block";
  el.innerHTML = `<div><h3>Udlejningsudgifter</h3>
    <div class="udlejningsudgifter-item">
      <p>Månedligt: ${månedlig.toLocaleString("da-DK")} kr.</p>
      <span class="tooltip">ℹ️<span class="tooltip-text">Månedlige driftsudgifter</span></span>
    </div>
    <div class="udlejningsudgifter-item">
      <p>Årligt: ${(månedlig * 12).toLocaleString("da-DK")} kr.</p>
      <span class="tooltip">ℹ️<span class="tooltip-text">Månedlige udgifter × 12</span></span>
    </div>
  </div>`;
}

function calculateSamletVurdering() {
  const månedligtCashflow = caseData.udlejning.månedligLeje - caseData.udlejning.månedligUdgifter;
  const totalGæld = (caseData.realkreditlån?.beløb || 0) + (caseData.banklån?.beløb || 0) + (caseData.andrelån?.beløb || 0);
  const årligEKF = (månedligtCashflow / caseData.egenkapital) * 12 * 100;
  const gældsgrad = (totalGæld / caseData.købspris) * 100;

  const vurdering = månedligtCashflow > 0 && årligEKF > 5 ? "God investering"
    : månedligtCashflow > 0 ? "Neutral investering" : "Dårlig investering";

  const cfStatus  = månedligtCashflow > 0 ? "god" : "dårlig";
  const ekfStatus = årligEKF > 8 ? "god" : årligEKF > 3 ? "neutral" : "dårlig";
  const gdStatus  = gældsgrad < 60 ? "god" : gældsgrad < 80 ? "neutral" : "dårlig";

  const badge = s => `<span class="status-badge status-${s}">${{god:"God",neutral:"Neutral",dårlig:"Dårlig"}[s]}</span>`;

  const el = document.getElementById("samletVurderingResult");
  el.style.display = "block";
  el.innerHTML = `
    <h3>Samlet vurdering</h3>
    <p>Vurdering: <strong>${vurdering}</strong></p>
    <button class="btn se-mere-btn" id="seMereBtn">Se mere om vurderingen</button>
    <div id="vurderingDetaljer" class="vurdering-detaljer" style="display:none;">
      <div class="parameter-række">
        <div class="parameter-navn">Cashflow</div>
        <div class="parameter-status">${badge(cfStatus)}</div>
        <div class="parameter-tekst">${månedligtCashflow > 0 ? `Positivt cashflow på ${månedligtCashflow.toLocaleString("da-DK")} kr/md.` : `Negativt cashflow på ${månedligtCashflow.toLocaleString("da-DK")} kr/md.`}</div>
      </div>
      <div class="parameter-række">
        <div class="parameter-navn">Egenkapitalforrentning</div>
        <div class="parameter-status">${badge(ekfStatus)}</div>
        <div class="parameter-tekst">Årlig forrentning: ${årligEKF.toFixed(2)}% — ${ekfStatus === "god" ? "over 8%, stærkt afkast." : ekfStatus === "neutral" ? "3–8%, moderat afkast." : "under 3%, lavt afkast."}</div>
      </div>
      <div class="parameter-række">
        <div class="parameter-navn">Gældsgrad</div>
        <div class="parameter-status">${badge(gdStatus)}</div>
        <div class="parameter-tekst">Gældsgrad: ${gældsgrad.toFixed(2)}% — ${gdStatus === "god" ? "under 60%, solid egenfinansiering." : gdStatus === "neutral" ? "60–80%, acceptabelt niveau." : "over 80%, høj belåning."}</div>
      </div>
    </div>`;

  document.getElementById("seMereBtn").addEventListener("click", () => {
    const d = document.getElementById("vurderingDetaljer");
    const b = document.getElementById("seMereBtn");
    const open = d.style.display === "block";
    d.style.display = open ? "none" : "block";
    b.textContent = open ? "Se mere om vurderingen" : "Skjul detaljer";
  });
}

// ── Knapper ─────────────────────────────────────────────────

const resultIds = [
  "cashflowResult", "egenkapitalforrentningResult", "gældsgradResult",
  "egenkapitalResult", "udlejningsindtægterResult", "udlejningsudgifterResult",
  "samletVurderingResult"
];

document.getElementById("calculateBtn").addEventListener("click", () => {
  calculateCashflow();
  calculateEgenkapitalforrentning();
  calculateGældsgrad();
  calculateEgenkapital();
  calculateUdlejningsindtægter();
  calculateUdlejningsudgifter();
  calculateSamletVurdering();
  document.getElementById("hideBtn").style.display = "block";
});

document.getElementById("hideBtn").addEventListener("click", () => {
  resultIds.forEach(id => {
    const el = document.getElementById(id);
    el.style.display = "none";
    el.innerHTML = "";
  });
  document.getElementById("hideBtn").style.display = "none";
});
