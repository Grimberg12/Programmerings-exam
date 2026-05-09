"use strict";
// Henter case-data fra backend + låndata fra localStorage og beregner 7 finansielle metrikker.
// Viser detaljeside, simuleringstabel og 30-årig simulering med linjegraf.

let caseData = null;

// Beregningsfunktioner leveres af beregninger.js (window.Beregninger)
const { beregnMånedligYdelse, beregnRenteYdelse, restgældEfterÅr } = Beregninger;

function normaliserLaan(beløb, type, rentePct, løbetid, afdragsFriPeriode) {
  if (!beløb || Number(beløb) <= 0) return null;

  const renType = String(type || "").includes(":")
    ? String(type || "").split(":")[1]
    : String(type || "");

  return {
    beløb: Number(beløb || 0),
    type: renType,
    rente: Number(rentePct || 0) / 100,
    løbetid: Number(løbetid || 0),
    afdragsFriPeriode: Number(afdragsFriPeriode || 0)
  };
}

// ── hentCase ─────────────────────────────────────────────────────────────────
// Henter alle brugerens cases og finder den der matcher URL-parameteren ?id=.
// Backend returnerer ikke låndata (afdragsfri, type) — det suppleres fra localStorage.
async function hentCase() {
  const savedUser = localStorage.getItem("loggedInUser");
  if (!savedUser) { window.location.href = "/login.html"; return null; }
  const user  = JSON.parse(savedUser);
  const urlId = Number(new URLSearchParams(window.location.search).get("id"));

  const response = await fetch(`/api/v1/users/${user.brugerID}/investment-cases`);
  const result   = await response.json();
  const f        = result.data?.find(c => Number(c.id) === urlId);
  if (!f) throw new Error("Case ikke fundet");

  const c = {
    id:                   Number(f.id),
    ejendomsProfilID:     Number(f.ejendomsProfilID),
    oprettetDato:         f.datoOprettet,
    navn:                 f.navn,
    beskrivelse:          f.beskrivelse,
    adresse:              `${f.vejNavn} ${f.vejNummer}, ${f.postnummer} ${f.bynavn}`,
    areal:                Number(f.areal || 0),
    antalVærelser:        Number(f.antalVaerelser || 0),

    købspris:             Number(f.koebsPris || 0),
    egenkapital:          Number(f.egenKapital || 0),
    advokat:              Number(f.advokat || 0),
    tinglysning:          Number(f.tinglysning || 0),
    koeberRaadgivning:    Number(f.koeberRaadgivning || 0),
    andre_omkostninger:   Number(f.andreOmkostninger || 0),
    renoveringsomkostninger: Number(f.renoveringsomkostninger || 0),

    driftsOmkostninger: Number(f.driftsOmkostninger || 0),

    realkreditlån: normaliserLaan(
      f.realkreditBeloeb,
      f.realkreditType,
      f.realkreditRente,
      f.realkreditLoebetid,
      f.realkreditAfdragsFriPeriode
    ),
    banklån: normaliserLaan(
      f.bankBeloeb,
      f.bankType,
      f.bankRente,
      f.bankLoebetid,
      f.bankAfdragsFriPeriode
    ),
    andrelån: normaliserLaan(
      f.andreBeloeb,
      f.andreType,
      f.andreRente,
      f.andreLoebetid,
      f.andreAfdragsFriPeriode
    ), 

    udlejning: {
      udlejes:          Boolean(f.erLejeBolig),
      månedligLeje:     Number(f.lejeIndkomst || 0),
      månedligUdgifter: Number(f.lejeUdgifter || 0)
    },
  };
  return c;
}

// ── Graf ─────────────────────────────────────────────────────────────────────
// Tegner linjegraf med Canvas API. Farver og baggrund hentes fra CSS-variabler i global.css.
// Beregner automatisk min/max og viser nul-linje ved negative værdier.
function tegnLinjeGraf(container, serier, options = {}) {
  const W   = Math.min(container.clientWidth || 700, 900);
  const H   = options.height || 280;
  const PAD = { top: 20, right: 20, bottom: 50, left: 90 };

  const canvas       = document.createElement("canvas");
  canvas.width       = W;
  canvas.height      = H;
  canvas.style.cssText = "width:100%;max-width:" + W + "px;display:block;border-radius:8px;";
  const ctx          = canvas.getContext("2d");

  const cs = getComputedStyle(document.documentElement);
  const C = {
    bg:       cs.getPropertyValue("--chart-bg").trim(),
    grid:     cs.getPropertyValue("--chart-grid").trim(),
    axisText: cs.getPropertyValue("--chart-axis-text").trim(),
    baseline: cs.getPropertyValue("--chart-baseline").trim(),
    label:    cs.getPropertyValue("--chart-label").trim(),
    farver: [
      cs.getPropertyValue("--chart-color-1").trim(),
      cs.getPropertyValue("--chart-color-2").trim(),
      cs.getPropertyValue("--chart-color-3").trim(),
      cs.getPropertyValue("--chart-color-4").trim(),
      cs.getPropertyValue("--chart-color-5").trim(),
    ],
  };

  const alleY = serier.flatMap(s => s.data);
  const minY  = Math.min(0, ...alleY);
  const maxY  = Math.max(...alleY, 1);
  const spanY = maxY - minY;

  const xPos = i => PAD.left + (i / 29) * (W - PAD.left - PAD.right);
  const yPos = v => PAD.top  + (1 - (v - minY) / spanY) * (H - PAD.top - PAD.bottom);

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Vandrette gitterlinjer + y-etiketter
  for (let t = 0; t <= 5; t++) {
    const v = minY + (spanY * t / 5);
    const y = yPos(v);
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
    ctx.fillStyle = C.axisText; ctx.font = "11px Arial"; ctx.textAlign = "right";
    const abs = Math.abs(v);
    const lbl = abs >= 1e6 ? (v / 1e6).toFixed(1) + " mio." : abs >= 1000 ? (v / 1000).toFixed(0) + "k" : Math.round(v).toString();
    ctx.fillText(lbl, PAD.left - 4, y + 4);
  }

  // Lodrette år-mærker (hvert 5. år)
  ctx.textAlign = "center";
  for (let år = 5; år <= 30; år += 5) {
    const x = xPos(år - 1);
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, H - PAD.bottom); ctx.stroke();
    ctx.fillStyle = C.axisText; ctx.font = "11px Arial";
    ctx.fillText("År " + år, x, H - PAD.bottom + 14);
  }

  // Nul-linje
  if (minY < 0) {
    const y0 = yPos(0);
    ctx.strokeStyle = C.baseline; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(PAD.left, y0); ctx.lineTo(W - PAD.right, y0); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Linjer
  serier.forEach((serie, si) => {
    const farve = serie.farve || C.farver[si % C.farver.length];
    ctx.strokeStyle = farve; ctx.lineWidth = 2.5;
    ctx.setLineDash(serie.stiplet ? [6, 3] : []);
    ctx.beginPath();
    serie.data.forEach((v, i) => {
      const x = xPos(i), y = yPos(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Legende
  const kol   = Math.max(1, Math.floor((W - PAD.left - PAD.right) / 200));
  const lx0   = PAD.left;
  const ly0   = H - PAD.bottom + 28;
  serier.forEach((serie, si) => {
    const farve = serie.farve || C.farver[si % C.farver.length];
    const lx    = lx0 + (si % kol) * 200;
    const ly    = ly0 + Math.floor(si / kol) * 16;
    ctx.fillStyle = farve;
    ctx.fillRect(lx, ly - 4, 16, 4);
    ctx.fillStyle = C.label; ctx.font = "11px Arial"; ctx.textAlign = "left";
    ctx.fillText(serie.label, lx + 20, ly);
  });

  container.appendChild(canvas);
}

// ── renderInvestmentCaseDetails ───────────────────────────────────────────────
function renderInvestmentCaseDetails() {
  const container = document.getElementById("investmentCaseDetails");
  const kr        = v => Number(v).toLocaleString("da-DK") + " kr.";
  const pct       = v => (v * 100).toFixed(2) + "%";

  function visLån(lån, titel) {
    if (!lån) return "";
    const afdragsFri  = lån.afdragsFriPeriode || 0;
    const amortYdelse = Math.round(beregnMånedligYdelse(lån.beløb, lån.rente, lån.løbetid, afdragsFri));
    const renteYdelse = Math.round(beregnRenteYdelse(lån.beløb, lån.rente));
    const løbetidÅr   = Math.floor(lån.løbetid / 12);
    const løbetidRest = lån.løbetid % 12;
    const løbetidTekst = løbetidÅr > 0
      ? løbetidÅr + " år" + (løbetidRest > 0 ? " og " + løbetidRest + " mdr." : "")
      : lån.løbetid + " mdr.";

    return `<div class="laan-detalje">
      <p class="laan-titel">${titel}</p>
      <p>${kr(lån.beløb)} · ${lån.type || "—"} · ${pct(lån.rente)} p.a. · ${løbetidTekst}</p>
      ${afdragsFri > 0 ? `
        <p><strong>Afdragsfri periode:</strong> ${afdragsFri} mdr. (${(afdragsFri / 12).toFixed(1)} år)</p>
        <p><strong>Ydelse i afdragsfri periode:</strong> ${kr(renteYdelse)}/md.</p>
        <p><strong>Ydelse efter afdragsfri periode:</strong> ${kr(amortYdelse)}/md.</p>
      ` : `<p><strong>Månedlig ydelse:</strong> ${kr(amortYdelse)}/md.</p>`}
    </div>`;
  }

  const harFinansiering = caseData.realkreditlån || caseData.banklån || caseData.andrelån;
  const samletYdelse    = [caseData.realkreditlån, caseData.banklån, caseData.andrelån]
    .filter(Boolean)
    .reduce((s, l) => s + beregnMånedligYdelse(l.beløb, l.rente, l.løbetid, l.afdragsFriPeriode || 0), 0);

  container.innerHTML = `
    <button class="edit-case-btn" id="editCaseBtn" title="Rediger case">✏️</button>
    <h2>${caseData.navn}</h2>
    <p class="case-beskrivelse">${caseData.beskrivelse || ""}</p>

    <div class="detalje-grid">
      <div class="detalje-sektion">
        <h3>Ejendom</h3>
        <p><strong>Adresse:</strong> ${caseData.adresse}</p>
        <p><strong>Areal:</strong> ${caseData.areal} m²</p>
        <p><strong>Antal værelser:</strong> ${caseData.antalVærelser}</p>
      </div>

      <div class="detalje-sektion">
        <h3>Købsomkostninger</h3>
        <p><strong>Købspris:</strong> ${kr(caseData.købspris)}</p>
        <p><strong>Egenkapital:</strong> ${kr(caseData.egenkapital)}</p>
        <p><strong>Advokat:</strong> ${kr(caseData.advokat)}</p>
        <p><strong>Tinglysning:</strong> ${kr(caseData.tinglysning)}</p>
        <p><strong>Køberrådgivning:</strong> ${kr(caseData.koeberRaadgivning)}</p>
        <p><strong>Andre omkostninger:</strong> ${kr(caseData.andre_omkostninger)}</p>
        <p><strong>Renoveringsomkostninger:</strong> ${kr(caseData.renoveringsomkostninger)}</p>
        ${caseData.driftsOmkostninger > 0 ? `<p><strong>Driftsomkostninger/md.:</strong> ${kr(caseData.driftsOmkostninger)}</p>` : ""}
        <p><strong>Samlede handelsomk.:</strong> ${kr(caseData.advokat + caseData.tinglysning + caseData.koeberRaadgivning + caseData.andre_omkostninger)}</p>
      </div>

      ${harFinansiering ? `
      <div class="detalje-sektion">
        <h3>Finansiering</h3>
        ${visLån(caseData.realkreditlån, "Realkreditlån")}
        ${visLån(caseData.banklån, "Banklån")}
        ${visLån(caseData.andrelån, "Andre lån")}
        ${samletYdelse > 0 ? `<p class="laan-total"><strong>Samlet månedlig ydelse:</strong> ${kr(Math.round(samletYdelse))}/md.</p>` : ""}
      </div>
      ` : ""}

      <div class="detalje-sektion">
        <h3>Udlejning</h3>
        ${caseData.udlejning.udlejes ? `
          <p><strong>Udlejes:</strong> Ja</p>
          <p><strong>Månedlig leje:</strong> ${kr(caseData.udlejning.månedligLeje)}</p>
          <p><strong>Månedlige udgifter:</strong> ${kr(caseData.udlejning.månedligUdgifter)}</p>
          <p><strong>Månedligt cashflow:</strong> ${kr(caseData.udlejning.månedligLeje - caseData.udlejning.månedligUdgifter - (caseData.driftsOmkostninger || 0))}</p>
        ` : "<p>Ejendommen udlejes ikke.</p>"}
      </div>
    </div>`;

  document.getElementById("editCaseBtn").addEventListener("click", () => {
    localStorage.setItem("editCase", JSON.stringify(caseData));
    window.location.href = `/ejendom.html?id=${caseData.ejendomsProfilID}`;
  });
}

// ── renderSimulationTabel ─────────────────────────────────────────────────────
// Beregner 7 finansielle metrikker: cashflow, ydelse, egenkapitalforrentning (EKF) og gældsgrad.
// EKF > 8% = god, 3-8% = neutral, < 3% = dårlig. Gældsgrad < 60% = god, > 80% = dårlig.
function renderSimulationTabel() {
  const månedligLeje      = caseData.udlejning.månedligLeje;
  const månedligeUdgifter = caseData.udlejning.månedligUdgifter;
  const driftsMd          = caseData.driftsOmkostninger || 0;
  const månedligtCashflow = månedligLeje - månedligeUdgifter - driftsMd;
  const årligtCashflow    = månedligtCashflow * 12;

  const alleLån           = [caseData.realkreditlån, caseData.banklån, caseData.andrelån].filter(Boolean);
  const totalGæld         = alleLån.reduce((s, l) => s + l.beløb, 0);
  const gældsgrad         = caseData.købspris > 0 ? totalGæld / caseData.købspris : 0;
  const gældsgradPct      = gældsgrad * 100;
  const egenkapitalBeregnet = caseData.købspris - totalGæld;

  const ekfMånedlig = caseData.egenkapital > 0 ? månedligtCashflow / caseData.egenkapital : 0;
  const ekfÅrlig    = ekfMånedlig * 12;
  const ekfÅrligPct = ekfÅrlig * 100;

  const samletYdelse = alleLån.reduce((s, l) =>
    s + beregnMånedligYdelse(l.beløb, l.rente, l.løbetid, l.afdragsFriPeriode || 0), 0);

  const cfStatus  = månedligtCashflow > 0 ? "god" : "dårlig";
  const ekfStatus = ekfÅrligPct > 8 ? "god" : ekfÅrligPct > 3 ? "neutral" : "dårlig";
  const gdStatus  = gældsgradPct < 60 ? "god" : gældsgradPct < 80 ? "neutral" : "dårlig";
  const vurderingStatus = månedligtCashflow > 0 && ekfÅrligPct > 5 ? "god" : månedligtCashflow > 0 ? "neutral" : "dårlig";
  const vurdering = { god: "God investering", neutral: "Neutral investering", dårlig: "Dårlig investering" }[vurderingStatus];

  const kr    = v => Number(v).toLocaleString("da-DK") + " kr.";
  const pct   = v => (v * 100).toFixed(2) + "%";
  const badge = s => `<span class="status-badge status-${s}">${{ god: "God", neutral: "Neutral", dårlig: "Dårlig" }[s]}</span>`;
  const tt    = text => `<span class="tooltip">ℹ️<span class="tooltip-text">${text}</span></span>`;
  const sektion = t => `<tr class="section-row"><td colspan="2">${t}</td></tr>`;
  const row     = (lbl, val, tip) => `<tr>
    <td class="row-label">${lbl}</td>
    <td class="sim-value-cell">${val}${tip ? " " + tt(tip) : ""}</td>
  </tr>`;

  const lånRækker = alleLån.length > 0 ? `
    ${sektion("Låneydelser")}
    ${[
      { lån: caseData.realkreditlån, navn: "Realkreditlån" },
      { lån: caseData.banklån,       navn: "Banklån" },
      { lån: caseData.andrelån,      navn: "Andre lån" }
    ].filter(x => x.lån).map(({ lån, navn }) => {
      const ydelse   = beregnMånedligYdelse(lån.beløb, lån.rente, lån.løbetid, lån.afdragsFriPeriode || 0);
      const rYdelse  = (lån.afdragsFriPeriode || 0) > 0 ? beregnRenteYdelse(lån.beløb, lån.rente) : null;
      return row(
        navn + " ydelse/md.",
        kr(Math.round(ydelse)),
        rYdelse ? `I afdragsfri periode: ${kr(Math.round(rYdelse))}/md. — efter: ${kr(Math.round(ydelse))}/md.` : null
      );
    }).join("")}
    ${row("Samlet månedlig ydelse", kr(Math.round(samletYdelse)), "Sum af alle lån")}
  ` : "";

  return `
    <div class="sim-wrapper">
      <table class="sammenlign-tabel">
        <thead><tr><th class="label-col">Beregning</th><th>Resultat</th></tr></thead>
        <tbody>
          ${sektion("Cashflow")}
          ${row("Månedligt cashflow", kr(månedligtCashflow), `Leje (${kr(månedligLeje)}) − udgifter (${kr(månedligeUdgifter)})${driftsMd > 0 ? ` − drift (${kr(driftsMd)}/md.)` : ""}`)}
          ${row("Årligt cashflow", kr(årligtCashflow), "Månedligt cashflow × 12")}

          ${lånRækker}

          ${sektion("Egenkapital")}
          ${row("Egenkapital (beregnet)", kr(egenkapitalBeregnet), `Købspris − total gæld`)}
          ${row("Egenkapitalforrentning/md.", pct(ekfMånedlig), `Cashflow / egenkapital (${kr(caseData.egenkapital)})`)}
          ${row("Egenkapitalforrentning/år", pct(ekfÅrlig), "Månedlig forrentning × 12")}

          ${sektion("Gæld")}
          ${totalGæld > 0 ? row("Total gæld", kr(totalGæld), "Summen af alle lån") : ""}
          ${row("Gældsgrad", pct(gældsgrad), `Total gæld / købspris`)}

          ${caseData.udlejning.udlejes ? `
          ${sektion("Udlejning")}
          ${row("Udlejningsindtægt/md.", kr(månedligLeje), "Månedlig lejeindtægt")}
          ${row("Udlejningsindtægt/år",  kr(månedligLeje * 12), "Månedlig leje × 12")}
          ${row("Udlejningsudgift/md.",  kr(månedligeUdgifter), "Månedlige driftsudgifter")}
          ${row("Udlejningsudgift/år",   kr(månedligeUdgifter * 12), "Månedlige udgifter × 12")}
          ` : ""}

          ${driftsMd > 0 ? `
          ${sektion("Driftsomkostninger")}
          ${row("Driftsomkostninger/md.", kr(driftsMd), "Løbende månedlige driftsomkostninger til ejendommen")}
          ${row("Driftsomkostninger/år",  kr(driftsMd * 12), "Månedlige driftsomkostninger × 12")}
          ` : ""}

          ${sektion("Samlet vurdering")}
          <tr>
            <td class="row-label">Overordnet vurdering</td>
            <td class="sim-value-cell"><span class="status-badge status-${vurderingStatus}">${vurdering}</span></td>
          </tr>
          <tr>
            <td class="row-label">Cashflow</td>
            <td class="sim-value-cell">
              ${badge(cfStatus)}
              <span class="vurdering-tekst">${månedligtCashflow >= 0 ? `Positivt cashflow på ${kr(månedligtCashflow)}/md.` : `Negativt cashflow på ${kr(månedligtCashflow)}/md.`}</span>
            </td>
          </tr>
          <tr>
            <td class="row-label">Egenkapitalforrentning</td>
            <td class="sim-value-cell">
              ${badge(ekfStatus)}
              <span class="vurdering-tekst">Årlig: ${ekfÅrligPct.toFixed(2)}% — ${ekfStatus === "god" ? "over 8%, stærkt afkast." : ekfStatus === "neutral" ? "3–8%, moderat afkast." : "under 3%, lavt afkast."}</span>
            </td>
          </tr>
          <tr>
            <td class="row-label">Gældsgrad</td>
            <td class="sim-value-cell">
              ${badge(gdStatus)}
              <span class="vurdering-tekst">${gældsgradPct.toFixed(2)}% — ${gdStatus === "god" ? "under 60%, solid egenfinansiering." : gdStatus === "neutral" ? "60–80%, acceptabelt niveau." : "over 80%, høj belåning."}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

// ── render30ÅrTabel ───────────────────────────────────────────────────────────
// Simulerer 30 år: cashflow akkumuleres år for år, restgæld beregnes via annuitetsformel,
// egenkapital = købspris − restgæld. Markerer milepæle (år 5, 10, 15...) og begivenheder (lån udløber).
function render30ÅrTabel() {
  const driftsMd = caseData.driftsOmkostninger || 0;
  const månedligtCashflow = (caseData.udlejning.udlejes
    ? caseData.udlejning.månedligLeje - caseData.udlejning.månedligUdgifter
    : 0) - driftsMd;
  const cashflowÅr = månedligtCashflow * 12;
  const kr         = v => Math.round(v).toLocaleString("da-DK") + " kr.";

  const alleLån = [
    { lån: caseData.realkreditlån, navn: "Realkreditlån" },
    { lån: caseData.banklån,       navn: "Banklån" },
    { lån: caseData.andrelån,      navn: "Andre lån" }
  ].filter(x => x.lån);

  // Begivenheder per år (afdragsfri slutter, lån udløber)
  function begivenhedForÅr(år) {
    const list = [];
    for (const { lån, navn } of alleLån) {
      const afdFri   = lån.afdragsFriPeriode || 0;
      const udløbÅr  = lån.løbetid / 12;
      if (afdFri > 0 && år === Math.ceil(afdFri / 12)) {
        list.push(`${navn}: afdragsfri periode slutter`);
      }
      if (år === Math.floor(udløbÅr) || (år === Math.ceil(udløbÅr) && udløbÅr > Math.floor(udløbÅr))) {
        list.push(`${navn} fuldt indfriet — refinansieringsmulighed`);
      }
    }
    return list;
  }

  let rækker        = "";
  let akkumuleret   = 0;
  const cashflowData    = [];
  const egenkapitalData = [];
  const restgaeldData   = [];

  for (let år = 1; år <= 30; år++) {
    akkumuleret += cashflowÅr;
    cashflowData.push(akkumuleret);

    let restgæld = 0;
    for (const { lån } of alleLån) {
      restgæld += restgældEfterÅr(lån.beløb, lån.rente, lån.løbetid, år, lån.afdragsFriPeriode || 0);
    }

    const egenkapital = caseData.købspris - restgæld;
    egenkapitalData.push(egenkapital);
    restgaeldData.push(restgæld);

    const erMilepæl  = år % 5 === 0;
    const begivenheder = begivenhedForÅr(år);
    const begivenhedHTML = begivenheder.length > 0
      ? begivenheder.map(b => `<span class="begivenhed-badge">${b}</span>`).join("")
      : "";

    rækker += `<tr class="${erMilepæl ? "sim30-milepæl" : ""}">
      <td class="row-label">${år}</td>
      <td>${kr(cashflowÅr)}</td>
      <td>${kr(akkumuleret)}</td>
      <td>${kr(restgæld)}</td>
      <td>${kr(egenkapital)}</td>
      <td class="begivenhed-celle">${begivenhedHTML}</td>
    </tr>`;
  }

  const html = `
    <div class="sim-wrapper" style="margin-top:24px;">
      <table class="sammenlign-tabel">
        <thead>
          <tr>
            <th class="label-col">År</th>
            <th>Cashflow/år</th>
            <th>Akkumuleret cashflow</th>
            <th>Restgæld</th>
            <th>Egenkapital</th>
            <th>Begivenheder</th>
          </tr>
        </thead>
        <tbody>${rækker}</tbody>
      </table>
      <div class="graf-overskrift">
        <h3>Udvikling over 30 år</h3>
        <p class="sim30-sub">Akkumuleret cashflow og egenkapitaludvikling år for år.</p>
      </div>
      <div id="graf30Ar" class="graf-container"></div>
    </div>`;

  return { html, cashflowData, egenkapitalData, restgaeldData };
}

// ── DOMContentLoaded ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  try {
    caseData = await hentCase();
  } catch (e) {
    const el = document.getElementById("investmentCaseDetails");
    if (el) el.innerHTML = "<p>Kunne ikke hente case-data. Prøv igen.</p>";
    return;
  }

  renderInvestmentCaseDetails();

  document.getElementById("calculateBtn").addEventListener("click", () => {
    const result = document.getElementById("simulationResult");
    result.innerHTML    = renderSimulationTabel();
    result.style.display = "block";
    document.getElementById("hideBtn").style.display = "block";
  });

  document.getElementById("hideBtn").addEventListener("click", () => {
    const result = document.getElementById("simulationResult");
    result.innerHTML     = "";
    result.style.display = "none";
    document.getElementById("hideBtn").style.display = "none";
  });

  document.getElementById("sim30Btn").addEventListener("click", () => {
    const result = document.getElementById("sim30Result");
    const btn    = document.getElementById("sim30Btn");

    if (result.innerHTML) {
      result.innerHTML     = "";
      result.style.display = "none";
      btn.textContent      = "Simuler over 30 år";
    } else {
      const sim = render30ÅrTabel();
result.innerHTML     = sim.html;
result.style.display = "block";
btn.textContent      = "Skjul 30-årig simulering";

const grafContainer = document.getElementById("graf30Ar");

if (grafContainer) {
  grafContainer.innerHTML = "";
  tegnLinjeGraf(grafContainer, [
    { label: "Akkumuleret cashflow", data: sim.cashflowData },
    { label: "Egenkapital",          data: sim.egenkapitalData, stiplet: true },
    { label: "Restgæld",             data: sim.restgaeldData,   farve: "#e74c3c" }
  ]);
}
    }
  });
});
