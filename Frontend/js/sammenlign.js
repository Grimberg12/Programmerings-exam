// Fuld mock-data med lånedetaljer til beregninger
const mockCases = [
  {
    id: 1,
    navn: "Lejlighed i København",
    adresse: "Rosenvængets Allé 2",
    areal: 120,
    antalVærelser: 3,
    købspris: 5000000,
    egenkapital: 1000000,
    andre_omkostninger: 50000,
    renoveringsomkostninger: 200000,
    realkreditlån: { beløb: 4000000, rente: 0.02,  løbetid: 30 },
    banklån:       { beløb: 500000,  rente: 0.05,  løbetid: 10 },
    andrelån:      { beløb: 500000,  rente: 0.05,  løbetid: 10 },
    udlejning: { udlejes: true, månedligLeje: 20000, månedligUdgifter: 5000 }
  },
  {
    id: 2,
    navn: "Rækkehus i Aarhus",
    adresse: "Åboulevarden 45",
    areal: 145,
    antalVærelser: 4,
    købspris: 3200000,
    egenkapital: 640000,
    andre_omkostninger: 30000,
    renoveringsomkostninger: 80000,
    realkreditlån: { beløb: 2560000, rente: 0.03, løbetid: 30 },
    banklån: null,
    andrelån: null,
    udlejning: { udlejes: true, månedligLeje: 14000, månedligUdgifter: 4000 }
  },
  {
    id: 3,
    navn: "Villa i Odense",
    adresse: "Frederiksgade 8",
    areal: 210,
    antalVærelser: 6,
    købspris: 7500000,
    egenkapital: 1875000,
    andre_omkostninger: 75000,
    renoveringsomkostninger: 350000,
    realkreditlån: { beløb: 5625000, rente: 0.025, løbetid: 30 },
    banklån:       { beløb: 500000,  rente: 0.045, løbetid: 15 },
    andrelån: null,
    udlejning: { udlejes: false, månedligLeje: 0, månedligUdgifter: 0 }
  }
];

function formatKr(v) {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("da-DK") + " kr.";
}

function formatPct(v) {
  if (v === null || v === undefined) return "—";
  return v.toFixed(2) + "%";
}

function beregnMetrikker(c) {
  const cashflowMd = c.udlejning.udlejes
    ? c.udlejning.månedligLeje - c.udlejning.månedligUdgifter
    : null;
  const cashflowÅr  = cashflowMd !== null ? cashflowMd * 12 : null;
  const ekfMd       = cashflowMd !== null ? (cashflowMd / c.egenkapital) * 100 : null;
  const ekfÅr       = ekfMd !== null ? ekfMd * 12 : null;
  const totalGæld   = (c.realkreditlån?.beløb || 0) + (c.banklån?.beløb || 0) + (c.andrelån?.beløb || 0);
  const gældsgrad   = (totalGæld / c.købspris) * 100;
  const samletInv   = c.købspris + c.andre_omkostninger + c.renoveringsomkostninger;

  const score = cashflowMd > 0 && ekfÅr > 5 ? 2 : cashflowMd > 0 ? 1 : 0;
  const vurderingTekst  = score === 2 ? "God investering" : score === 1 ? "Neutral investering" : "Dårlig investering";
  const vurderingStatus = score === 2 ? "god" : score === 1 ? "neutral" : "dårlig";

  return {
    cashflowMd, cashflowÅr, ekfMd, ekfÅr, gældsgrad, samletInv,
    vurderingTekst, vurderingStatus, score,
    udlIndtægtMd: c.udlejning.udlejes ? c.udlejning.månedligLeje : null,
    udlUdgiftMd:  c.udlejning.udlejes ? c.udlejning.månedligUdgifter : null
  };
}

function bedsteIndices(værdier, højest = true) {
  const med = værdier.map((v, i) => ({ v, i })).filter(x => x.v !== null && x.v !== undefined);
  if (med.length === 0) return new Set();
  const bedst = højest ? Math.max(...med.map(x => x.v)) : Math.min(...med.map(x => x.v));
  return new Set(med.filter(x => x.v === bedst).map(x => x.i));
}

function renderTabel(cases, metrikker) {
  const n = cases.length;

  const bedsteCF     = bedsteIndices(metrikker.map(m => m.cashflowMd), true);
  const bedsteEKF    = bedsteIndices(metrikker.map(m => m.ekfÅr), true);
  const bedsteGæld   = bedsteIndices(metrikker.map(m => m.gældsgrad), false);
  const bedsteScore  = bedsteIndices(metrikker.map(m => m.score), true);
  const bedsteIndtægt = bedsteIndices(metrikker.map(m => m.udlIndtægtMd), true);
  const lavUdgift    = bedsteIndices(metrikker.map(m => m.udlUdgiftMd), false);

  function celle(i, v, bedste) {
    const klasse = bedste.has(i) ? " class=\"best-value\"" : "";
    return `<td${klasse}>${v}</td>`;
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
        ${row("Areal",           (c) => `${c.areal} m²`,         new Set())}
        ${row("Antal værelser",  (c) => `${c.antalVærelser}`,    new Set())}

        ${sektionRow("Økonomi")}
        ${row("Købspris",                (c) => formatKr(c.købspris),             new Set())}
        ${row("Egenkapital",             (c) => formatKr(c.egenkapital),          new Set())}
        ${row("Renoveringsomkostninger", (c) => formatKr(c.renoveringsomkostninger), new Set())}
        ${row("Samlet investering",      (c, m) => formatKr(m.samletInv),         new Set())}

        ${sektionRow("Simulering")}
        ${row("Cashflow / md.",          (c, m, i) => m.cashflowMd !== null ? formatKr(m.cashflowMd) : "—",  bedsteCF)}
        ${row("Cashflow / år",           (c, m, i) => m.cashflowÅr !== null ? formatKr(m.cashflowÅr) : "—",  bedsteCF)}
        ${row("Egenkapitalforrentning/md.", (c, m) => m.ekfMd !== null ? formatPct(m.ekfMd) : "—",           bedsteEKF)}
        ${row("Egenkapitalforrentning/år",  (c, m) => m.ekfÅr !== null ? formatPct(m.ekfÅr) : "—",           bedsteEKF)}
        ${row("Gældsgrad",               (c, m) => formatPct(m.gældsgrad),        bedsteGæld)}
        ${row("Udlejningsindtægt / md.", (c, m, i) => m.udlIndtægtMd !== null ? formatKr(m.udlIndtægtMd) : "—", bedsteIndtægt)}
        ${row("Udlejningsudgift / md.",  (c, m, i) => m.udlUdgiftMd  !== null ? formatKr(m.udlUdgiftMd)  : "—", lavUdgift)}

        ${sektionRow("Vurdering")}
        <tr>
          <td class="row-label">Samlet vurdering</td>
          ${metrikker.map((m, i) => `
            <td class="${bedsteScore.has(i) ? "best-value" : ""}">
              <span class="status-badge status-${m.vurderingStatus}">${m.vurderingTekst}</span>
            </td>`).join("")}
        </tr>
      </tbody>
    </table>
  `;
}

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

function render30ÅrSammenligning(cases) {
  const cashflows = cases.map(c =>
    c.udlejning.udlejes ? (c.udlejning.månedligLeje - c.udlejning.månedligUdgifter) * 12 : 0
  );
  const kr = v => Math.round(v).toLocaleString("da-DK") + " kr.";
  const akkumulerede = cases.map(() => 0);
  let rækker = "";

  for (let år = 1; år <= 30; år++) {
    const erMilepæl = år % 5 === 0;
    cases.forEach((_, i) => { akkumulerede[i] += cashflows[i]; });

    const restgælde = cases.map(c => {
      let total = 0;
      for (const lån of [c.realkreditlån, c.banklån, c.andrelån]) {
        if (lån) total += restgældEfterÅr(lån.beløb, lån.rente, lån.løbetid, år);
      }
      return total;
    });

    const egenkapitaler = cases.map((c, i) => c.købspris - restgælde[i]);

    rækker += `<tr class="${erMilepæl ? "sim30-milepæl" : ""}">
      <td class="row-label">${år}</td>
      ${cases.map((_, i) => `
        <td>${kr(cashflows[i])}</td>
        <td>${kr(akkumulerede[i])}</td>
        <td>${kr(restgælde[i])}</td>
        <td>${kr(egenkapitaler[i])}</td>
      `).join("")}
    </tr>`;
  }

  return `
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
    </table>`;
}

// ── Init ─────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const ids = (params.get("ids") || "").split(",").map(Number).filter(Boolean);
  const cases = ids.map(id => mockCases.find(c => c.id === id)).filter(Boolean);
  const indhold = document.getElementById("sammenlignIndhold");

  if (cases.length < 2) {
    indhold.innerHTML = `
      <p class="fejl-tekst">Mindst 2 cases skal vælges.
        <a href="/compare.html" class="tilbage-link">← Gå tilbage</a>
      </p>`;
    return;
  }

  const metrikker = cases.map(beregnMetrikker);
  indhold.innerHTML = renderTabel(cases, metrikker);

  // Vis 30-årig sektion og sæt knap-handler
  document.getElementById("sim30Sektion").style.display = "block";

  document.getElementById("sim30Btn").addEventListener("click", () => {
    const result = document.getElementById("sim30Result");
    const btn    = document.getElementById("sim30Btn");
    if (result.innerHTML) {
      result.innerHTML = "";
      result.style.display = "none";
      btn.textContent = "Simuler cashflow over 30 år";
    } else {
      result.innerHTML = render30ÅrSammenligning(cases);
      result.style.display = "block";
      btn.textContent = "Skjul 30-årig simulering";
    }
  });
});
