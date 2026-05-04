// ── Låneberegning ─────────────────────────────────────────────────────────────
function beregnMånedligYdelse(beløb, rente, løbetidMdr, afdragsFriMdr = 0) {
  if (!beløb || beløb <= 0 || !løbetidMdr || løbetidMdr <= 0) return 0;
  const i        = rente / 12;
  const amortMdr = løbetidMdr - afdragsFriMdr;
  if (amortMdr <= 0) return i === 0 ? 0 : beløb * i;
  if (i === 0)       return beløb / amortMdr;
  return beløb * i / (1 - Math.pow(1 + i, -amortMdr));
}

function restgældEfterÅr(P, rente, løbetidMdr, år, afdragsFriMdr = 0) {
  const kMdr     = år * 12;
  if (kMdr >= løbetidMdr) return 0;
  const i        = rente / 12;
  const amortMdr = løbetidMdr - afdragsFriMdr;
  if (kMdr <= afdragsFriMdr) return P;
  const elapsed  = kMdr - afdragsFriMdr;
  if (amortMdr <= 0 || elapsed >= amortMdr) return 0;
  if (i === 0) return P * (1 - elapsed / amortMdr);
  const M = P * i / (1 - Math.pow(1 + i, -amortMdr));
  return Math.max(0, P * Math.pow(1 + i, elapsed) - M * (Math.pow(1 + i, elapsed) - 1) / i);
}

// ── localStorage: låndata ────────────────────────────────────────────────────
function hentLånDataFraStorage(caseId) {
  try {
    const raw = localStorage.getItem(`invCase_loans_${caseId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── hentCases ─────────────────────────────────────────────────────────────────
async function hentCases() {
  const savedUser = localStorage.getItem("loggedInUser");
  if (!savedUser) { window.location.href = "/login.html"; return []; }
  const user = JSON.parse(savedUser);

  const response = await fetch(`/api/v1/users/${user.brugerID}/investment-cases`);
  const result   = await response.json();
  if (!response.ok) throw new Error(result.message || "Kunne ikke hente cases");

  return result.data.map(c => {
    const caseObj = {
      id:                   Number(c.id),
      ejendomsProfilID:     Number(c.ejendomsProfilID),
      oprettetDato:         c.datoOprettet,
      navn:                 c.navn,
      beskrivelse:          c.beskrivelse,
      adresse:              `${c.vejNavn} ${c.vejNummer}, ${c.postnummer} ${c.bynavn}`,
      areal:                Number(c.areal || 0),
      antalVærelser:        Number(c.antalVaerelser || 0),
      købspris:             Number(c.koebsPris || 0),
      egenkapital:          Number(c.egenKapital || 0),
      advokat:              Number(c.advokat || 0),
      tinglysning:          Number(c.tinglysning || 0),
      koeberRaadgivning:    Number(c.koeberRaadgivning || 0),
      andre_omkostninger:   Number(c.andreOmkostninger || 0),
      renoveringsomkostninger: Number(c.renoveringsomkostninger || 0),
      driftsOmkostninger:   0,
      realkreditlån:        null,
      banklån:              null,
      andrelån:             null,
      udlejning: {
        udlejes:          Boolean(c.erLejeBolig),
        månedligLeje:     Number(c.lejeIndkomst || 0),
        månedligUdgifter: Number(c.lejeUdgifter || 0)
      }
    };

    // Suppler med låndata fra localStorage
    const lånData = hentLånDataFraStorage(caseObj.id);
    if (lånData) {
      caseObj.realkreditlån      = lånData.realkreditlån     || null;
      caseObj.banklån            = lånData.banklån            || null;
      caseObj.andrelån           = lånData.andrelån           || null;
      caseObj.driftsOmkostninger = lånData.driftsOmkostninger || 0;
    }
    return caseObj;
  });
}

// ── Formatering ───────────────────────────────────────────────────────────────
function formatKr(v) {
  if (v === null || v === undefined) return "—";
  return Math.round(v).toLocaleString("da-DK") + " kr.";
}
function formatPct(v) {
  if (v === null || v === undefined) return "—";
  return v.toFixed(2) + "%";
}

// ── beregnMetrikker ───────────────────────────────────────────────────────────
function beregnMetrikker(c) {
  const driftsMd   = c.driftsOmkostninger || 0;
  const cashflowMd = c.udlejning.udlejes
    ? c.udlejning.månedligLeje - c.udlejning.månedligUdgifter - driftsMd
    : null;
  const cashflowÅr = cashflowMd !== null ? cashflowMd * 12 : null;
  const ekfMd      = cashflowMd !== null && c.egenkapital > 0 ? (cashflowMd / c.egenkapital) * 100 : null;
  const ekfÅr      = ekfMd !== null ? ekfMd * 12 : null;

  const alleLån  = [c.realkreditlån, c.banklån, c.andrelån].filter(Boolean);
  const totalGæld = alleLån.reduce((s, l) => s + l.beløb, 0);
  const gældsgrad  = c.købspris > 0 ? (totalGæld / c.købspris) * 100 : 0;

  const samletYdelse = alleLån.reduce((s, l) =>
    s + beregnMånedligYdelse(l.beløb, l.rente, l.løbetid, l.afdragsFriMåneder || 0), 0);

  const samletInv      = c.købspris + c.andre_omkostninger + c.renoveringsomkostninger;
  const score          = cashflowMd > 0 && ekfÅr > 5 ? 2 : cashflowMd > 0 ? 1 : 0;
  const vurderingTekst = score === 2 ? "God investering" : score === 1 ? "Neutral investering" : "Dårlig investering";
  const vurderingStatus = score === 2 ? "god" : score === 1 ? "neutral" : "dårlig";

  return {
    cashflowMd, cashflowÅr, ekfMd, ekfÅr, gældsgrad, samletInv, totalGæld,
    samletYdelse: samletYdelse > 0 ? samletYdelse : null,
    vurderingTekst, vurderingStatus, score,
    udlIndtægtMd: c.udlejning.udlejes ? c.udlejning.månedligLeje    : null,
    udlUdgiftMd:  c.udlejning.udlejes ? c.udlejning.månedligUdgifter : null
  };
}

// ── bedste/laveste i en kolonne ───────────────────────────────────────────────
function bedsteIndices(værdier, højest = true) {
  const med = værdier.map((v, i) => ({ v, i })).filter(x => x.v !== null && x.v !== undefined);
  if (med.length === 0) return new Set();
  const bedst = højest ? Math.max(...med.map(x => x.v)) : Math.min(...med.map(x => x.v));
  return new Set(med.filter(x => x.v === bedst).map(x => x.i));
}

// ── renderTabel ───────────────────────────────────────────────────────────────
function renderTabel(cases, metrikker) {
  const n = cases.length;

  const bedsteCF      = bedsteIndices(metrikker.map(m => m.cashflowMd), true);
  const bedsteEKF     = bedsteIndices(metrikker.map(m => m.ekfÅr), true);
  const bedsteGæld    = bedsteIndices(metrikker.map(m => m.gældsgrad), false);
  const bedsteScore   = bedsteIndices(metrikker.map(m => m.score), true);
  const bedsteIndtægt = bedsteIndices(metrikker.map(m => m.udlIndtægtMd), true);
  const lavUdgift     = bedsteIndices(metrikker.map(m => m.udlUdgiftMd), false);
  const lavYdelse     = bedsteIndices(metrikker.map(m => m.samletYdelse), false);

  function celle(i, v, bedste) {
    return `<td${bedste.has(i) ? ' class="best-value"' : ""}>${v}</td>`;
  }

  function row(label, mapper, bedste) {
    return `<tr>
      <td class="row-label">${label}</td>
      ${cases.map((c, i) => celle(i, mapper(c, metrikker[i], i), bedste)).join("")}
    </tr>`;
  }

  function sektionRow(titel) {
    return `<tr class="section-row"><td colspan="${n + 1}">${titel}</td></tr>`;
  }

  function visLån(c, lånObj, titel) {
    if (!lånObj) return "—";
    const ydelse    = beregnMånedligYdelse(lånObj.beløb, lånObj.rente, lånObj.løbetid, lånObj.afdragsFriMåneder || 0);
    const afdragsFriTekst = (lånObj.afdragsFriMåneder || 0) > 0
      ? ` (${lånObj.afdragsFriMåneder} mdr. afdragsfrit)` : "";
    return `${formatKr(lånObj.beløb)}<br><small>${(lånObj.rente * 100).toFixed(2)}% · ${lånObj.løbetid} mdr.${afdragsFriTekst}</small><br><small>Ydelse: ${formatKr(Math.round(ydelse))}/md.</small>`;
  }

  const harLån = cases.some(c => c.realkreditlån || c.banklån || c.andrelån);

  return `
    <table class="sammenlign-tabel">
      <thead>
        <tr>
          <th class="label-col"></th>
          ${cases.map(c => `
            <th>
              <span class="col-navn">${c.navn}</span>
              <span class="col-adresse">${c.adresse}</span>
            </th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${sektionRow("Ejendom")}
        ${row("Areal",           c => `${c.areal} m²`,       new Set())}
        ${row("Antal værelser",  c => `${c.antalVærelser}`,  new Set())}

        ${sektionRow("Økonomi")}
        ${row("Købspris",                c => formatKr(c.købspris),              new Set())}
        ${row("Egenkapital",             c => formatKr(c.egenkapital),           new Set())}
        ${row("Advokat",                 c => formatKr(c.advokat),               new Set())}
        ${row("Tinglysning",             c => formatKr(c.tinglysning),           new Set())}
        ${row("Køberrådgivning",         c => formatKr(c.koeberRaadgivning),     new Set())}
        ${row("Andre omkostninger",      c => formatKr(c.andre_omkostninger),    new Set())}
        ${row("Renoveringsomkostninger", c => formatKr(c.renoveringsomkostninger), new Set())}
        ${cases.some(c => c.driftsOmkostninger > 0) ? row("Driftsomkostninger/md.", c => formatKr(c.driftsOmkostninger), new Set()) : ""}
        ${row("Samlet investering",      (c, m) => formatKr(m.samletInv),        new Set())}

        ${harLån ? `
        ${sektionRow("Finansiering")}
        ${row("Realkreditlån",   (c) => visLån(c, c.realkreditlån, "Realkreditlån"),   new Set())}
        ${row("Banklån",         (c) => visLån(c, c.banklån, "Banklån"),               new Set())}
        ${row("Andre lån",       (c) => visLån(c, c.andrelån, "Andre lån"),            new Set())}
        ${row("Total gæld",      (c, m) => formatKr(m.totalGæld),                      new Set())}
        ${row("Samlet ydelse/md.",(c, m, i) => m.samletYdelse ? formatKr(Math.round(m.samletYdelse)) : "—", lavYdelse)}
        ` : ""}

        ${sektionRow("Simulering")}
        ${row("Cashflow / md.",            (c, m, i) => m.cashflowMd !== null ? formatKr(m.cashflowMd) : "—",     bedsteCF)}
        ${row("Cashflow / år",             (c, m, i) => m.cashflowÅr !== null ? formatKr(m.cashflowÅr) : "—",     bedsteCF)}
        ${row("Egenkapitalforrentning/md.", (c, m) => m.ekfMd !== null ? formatPct(m.ekfMd) : "—",                bedsteEKF)}
        ${row("Egenkapitalforrentning/år",  (c, m) => m.ekfÅr !== null ? formatPct(m.ekfÅr) : "—",                bedsteEKF)}
        ${row("Gældsgrad",                 (c, m) => formatPct(m.gældsgrad),                                       bedsteGæld)}
        ${row("Udlejningsindtægt / md.",   (c, m, i) => m.udlIndtægtMd !== null ? formatKr(m.udlIndtægtMd) : "—", bedsteIndtægt)}
        ${row("Udlejningsudgift / md.",    (c, m, i) => m.udlUdgiftMd  !== null ? formatKr(m.udlUdgiftMd)  : "—", lavUdgift)}

        ${sektionRow("Vurdering")}
        <tr>
          <td class="row-label">Samlet vurdering</td>
          ${metrikker.map((m, i) => `
            <td${bedsteScore.has(i) ? ' class="best-value"' : ""}>
              <span class="status-badge status-${m.vurderingStatus}">${m.vurderingTekst}</span>
            </td>`).join("")}
        </tr>
      </tbody>
    </table>`;
}

// ── Graf ─────────────────────────────────────────────────────────────────────
function tegnLinjeGraf(container, serier, options = {}) {
  const W   = Math.min(container.clientWidth || 900, 1100);
  const H   = options.height || 300;
  const PAD = { top: 20, right: 20, bottom: 55, left: 90 };

  const canvas       = document.createElement("canvas");
  canvas.width       = W;
  canvas.height      = H;
  canvas.style.cssText = "width:100%;max-width:" + W + "px;display:block;border-radius:8px;";
  const ctx          = canvas.getContext("2d");

  const alleY = serier.flatMap(s => s.data);
  const minY  = Math.min(0, ...alleY);
  const maxY  = Math.max(...alleY, 1);
  const spanY = maxY - minY;

  const xPos = i => PAD.left + (i / 29) * (W - PAD.left - PAD.right);
  const yPos = v => PAD.top  + (1 - (v - minY) / spanY) * (H - PAD.top - PAD.bottom);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  for (let t = 0; t <= 5; t++) {
    const v = minY + (spanY * t / 5);
    const y = yPos(v);
    ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
    ctx.fillStyle = "#9ca3af"; ctx.font = "11px Arial"; ctx.textAlign = "right";
    const abs = Math.abs(v);
    const lbl = abs >= 1e6 ? (v / 1e6).toFixed(1) + " mio." : abs >= 1000 ? (v / 1000).toFixed(0) + "k" : Math.round(v).toString();
    ctx.fillText(lbl, PAD.left - 4, y + 4);
  }

  ctx.textAlign = "center";
  for (let år = 5; år <= 30; år += 5) {
    const x = xPos(år - 1);
    ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, H - PAD.bottom); ctx.stroke();
    ctx.fillStyle = "#9ca3af"; ctx.font = "11px Arial";
    ctx.fillText("År " + år, x, H - PAD.bottom + 14);
  }

  if (minY < 0) {
    const y0 = yPos(0);
    ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(PAD.left, y0); ctx.lineTo(W - PAD.right, y0); ctx.stroke();
    ctx.setLineDash([]);
  }

  const farver = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  serier.forEach((serie, si) => {
    const farve = serie.farve || farver[si % farver.length];
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

  const kol = Math.max(1, Math.floor((W - PAD.left - PAD.right) / 200));
  const lx0 = PAD.left;
  const ly0 = H - PAD.bottom + 28;
  serier.forEach((serie, si) => {
    const farve = serie.farve || farver[si % farver.length];
    const lx    = lx0 + (si % kol) * 200;
    const ly    = ly0 + Math.floor(si / kol) * 16;
    ctx.fillStyle = farve;
    ctx.fillRect(lx, ly - 4, 16, 4);
    ctx.fillStyle = "#374151"; ctx.font = "11px Arial"; ctx.textAlign = "left";
    ctx.fillText(serie.label, lx + 20, ly);
  });

  container.appendChild(canvas);
}

// ── render30ÅrSammenligning ───────────────────────────────────────────────────
function render30ÅrSammenligning(cases) {
  const cashflowsÅr    = cases.map(c => {
    const driftsMd = c.driftsOmkostninger || 0;
    return c.udlejning.udlejes
      ? (c.udlejning.månedligLeje - c.udlejning.månedligUdgifter - driftsMd) * 12
      : -driftsMd * 12;
  });
  const kr             = v => Math.round(v).toLocaleString("da-DK") + " kr.";
  const akkumulerede   = cases.map(() => 0);
  const alleCFData     = cases.map(() => []);
  const alleEKData     = cases.map(() => []);
  let rækker           = "";

  for (let år = 1; år <= 30; år++) {
    const erMilepæl = år % 5 === 0;
    cases.forEach((_, i) => { akkumulerede[i] += cashflowsÅr[i]; });

    const restgælde = cases.map(c => {
      let total = 0;
      for (const lån of [c.realkreditlån, c.banklån, c.andrelån]) {
        if (lån) total += restgældEfterÅr(lån.beløb, lån.rente, lån.løbetid, år, lån.afdragsFriMåneder || 0);
      }
      return total;
    });

    const egenkapitaler = cases.map((c, i) => c.købspris - restgælde[i]);

    cases.forEach((_, i) => {
      alleCFData[i].push(akkumulerede[i]);
      alleEKData[i].push(egenkapitaler[i]);
    });

    rækker += `<tr class="${erMilepæl ? "sim30-milepæl" : ""}">
      <td class="row-label">${år}</td>
      ${cases.map((_, i) => `
        <td>${kr(cashflowsÅr[i])}</td>
        <td>${kr(akkumulerede[i])}</td>
        <td>${kr(restgælde[i])}</td>
        <td>${kr(egenkapitaler[i])}</td>
      `).join("")}
    </tr>`;
  }

  return {
    html: `
      <table class="sammenlign-tabel">
        <thead>
          <tr>
            <th class="label-col" rowspan="2">År</th>
            ${cases.map(c => `<th colspan="4" class="sim30-case-header">${c.navn}</th>`).join("")}
          </tr>
          <tr>
            ${cases.map(() => `
              <th class="sim30-sub-header">Cashflow/år</th>
              <th class="sim30-sub-header">Akkumuleret</th>
              <th class="sim30-sub-header">Restgæld</th>
              <th class="sim30-sub-header">Egenkapital</th>
            `).join("")}
          </tr>
        </thead>
        <tbody>${rækker}</tbody>
      </table>`,
    alleCFData,
    alleEKData
  };
}

// ── DOMContentLoaded ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const params    = new URLSearchParams(window.location.search);
  const ids       = (params.get("ids") || "").split(",").map(Number).filter(Boolean);
  const alleCases = await hentCases();
  const cases     = ids.map(id => alleCases.find(c => Number(c.id) === id)).filter(Boolean);
  const indhold   = document.getElementById("sammenlignIndhold");

  if (cases.length < 2) {
    indhold.innerHTML = `
      <p class="fejl-tekst">Mindst 2 cases skal vælges.
        <a href="/compare.html" class="tilbage-link">← Gå tilbage</a>
      </p>`;
    return;
  }

  const metrikker  = cases.map(beregnMetrikker);
  indhold.innerHTML = renderTabel(cases, metrikker);

  document.getElementById("sim30Sektion").style.display = "block";

  document.getElementById("sim30Btn").addEventListener("click", () => {
    const result = document.getElementById("sim30Result");
    const btn    = document.getElementById("sim30Btn");

    const grafDiv = document.getElementById("sam30Graf");
    if (result.innerHTML) {
      result.innerHTML     = "";
      result.style.display = "none";
      btn.textContent      = "Simuler cashflow over 30 år";
      if (grafDiv) grafDiv.innerHTML = "";
    } else {
      const { html, alleCFData, alleEKData } = render30ÅrSammenligning(cases);
      result.innerHTML     = html;
      result.style.display = "block";
      btn.textContent      = "Skjul 30-årig simulering";

      if (grafDiv) {
        grafDiv.innerHTML = "";
        const caseKolorer = ["#4f46e5", "#10b981", "#f59e0b"];
        const serier = [];
        cases.forEach((c, i) => {
          serier.push({ label: c.navn + " — cashflow",    data: alleCFData[i], farve: caseKolorer[i % caseKolorer.length] });
          serier.push({ label: c.navn + " — egenkapital", data: alleEKData[i], farve: caseKolorer[i % caseKolorer.length], stiplet: true });
        });
        tegnLinjeGraf(grafDiv, serier, { height: 320 });
      }
    }
  });
});
