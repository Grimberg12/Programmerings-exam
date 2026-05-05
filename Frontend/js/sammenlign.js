// ── Låneberegning ─────────────────────────────────────────────────────────────
// Beregner månedlig ydelse for et lån, givet beløb, rente, løbetid i måneder og eventuelle afdragsfri måneder. Håndterer også rentefri lån (rente = 0) korrekt.
function beregnMånedligYdelse(beløb, rente, løbetidMdr, afdragsFriMdr = 0) {
  if (!beløb || beløb <= 0 || !løbetidMdr || løbetidMdr <= 0) return 0;
  const i        = rente / 12;
  const amortMdr = løbetidMdr - afdragsFriMdr;
  if (amortMdr <= 0) return i === 0 ? 0 : beløb * i;
  if (i === 0)       return beløb / amortMdr;
  return beløb * i / (1 - Math.pow(1 + i, -amortMdr));
}

// Beregner restgæld efter et givent antal år, givet låneparametre og eventuelle afdragsfri måneder.
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
// Håndterer låndata i localStorage, som ikke nødvendigvis er en del af casens primære data i backend
function hentLånDataFraStorage(caseId) {
  try {
    const raw = localStorage.getItem(`invCase_loans_${caseId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── hentCases ─────────────────────────────────────────────────────────────────
// Henter cases fra backend, som allerede har indhentet og inkluderet de nødvendige data fra DAWA, så frontend ikke behøver at bekymre sig om det.
async function hentCases() {
  const savedUser = localStorage.getItem("loggedInUser");
  if (!savedUser) { window.location.href = "/login.html"; return []; }
  const user = JSON.parse(savedUser);

  // Henter cases fra backend. Backend sørger for at hente og inkludere de nødvendige data fra DAWA, så frontend ikke behøver at bekymre sig om det.
  const response = await fetch(`/api/v1/users/${user.brugerID}/investment-cases`);
  const result   = await response.json();
  if (!response.ok) throw new Error(result.message || "Kunne ikke hente cases");


  // Mapper backend-data til det format, frontend forventer. Sørger også for at supplere med låndata fra localStorage, så de er tilgængelige i metrik-beregningerne og visningen, selvom de ikke er en del af casens primære data i backend.
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

    // Suppler med låndata fra localStorage (der ikke er en del af casens primære data, og derfor ikke nødvendigvis kommer fra backend)
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
/*formatKr og formatPct håndterer null/undefined ved at returnere "—", så vi undgår at vise "0 kr." eller "0.00%" for værdier, der ikke er relevante eller ikke kan beregnes.
Sørger også for at tallene formateres pænt med danske tusindtalsseparatorer og "kr." suffix, eller to decimaler og "%" for procenter.
Dette gør da-DK ved at formattere efter danske regler. 
*/
function formatKr(v) {
  if (v === null || v === undefined) return "—";
  return Math.round(v).toLocaleString("da-DK") + " kr.";
}
function formatPct(v) {
  if (v === null || v === undefined) return "—";
  return v.toFixed(2) + "%";
}

// ── beregnMetrikker ───────────────────────────────────────────────────────────
/*
Beregner alle de nødvendige metrikker for en given case, som bruges i sammenligningen og vurderingen. 
Håndterer også tilfælde hvor visse data ikke er tilgængelige eller relevante (f.eks. hvis ejendommen ikke udlejes, eller hvis egenkapitalen er 0), 
ved at returnere null for de metrikker, der ikke kan beregnes, så vi kan vise "—" i tabellen i stedet for at forsøge at vise et tal, der ikke giver mening.
*/
function beregnMetrikker(c) {
  const driftsMd   = c.driftsOmkostninger || 0;
  const cashflowMd = c.udlejning.udlejes
    ? c.udlejning.månedligLeje - c.udlejning.månedligUdgifter - driftsMd
    : null;
  const cashflowÅr = cashflowMd !== null ? cashflowMd * 12 : null;
  const ekfMd      = cashflowMd !== null && c.egenkapital > 0 ? (cashflowMd / c.egenkapital) * 100 : null;
  const ekfÅr      = ekfMd !== null ? ekfMd * 12 : null;


  /* Beregner gældsgrad og samlet månedlig ydelse for alle lån. 
     Håndterer også tilfælde hvor der ikke er lån, ved at returnere 0 for gældsgrad og null for samlet ydelse, 
     så vi kan vise "0%" og "—" i tabellen i stedet for at forsøge at vise et tal, der ikke giver mening.
     Med filter(Boolean) fjerner vi eventuelle null-værdier for lån, så vi kun beregner gældsgrad og ydelse ud fra de lån, der rent faktisk findes for casen.
  */
     const alleLån  = [c.realkreditlån, c.banklån, c.andrelån].filter(Boolean);
  const totalGæld = alleLån.reduce((s, l) => s + l.beløb, 0);
  const gældsgrad  = c.købspris > 0 ? (totalGæld / c.købspris) * 100 : 0;

//med reduce kan vi summere ydelsen for alle lån i én operation, i stedet for at skulle beregne og gemme ydelsen for hvert lån separat og så summere dem bagefter. Det gør koden mere kompakt og lettere at læse, samtidig med at det håndterer tilfældet hvor der ikke er nogen lån (hvor samletYdelse så korrekt bliver 0).
  const samletYdelse = alleLån.reduce((s, l) =>
    s + beregnMånedligYdelse(l.beløb, l.rente, l.løbetid, l.afdragsFriMåneder || 0), 0);


  const samletInv      = c.købspris + c.andre_omkostninger + c.renoveringsomkostninger;
  const score          = cashflowMd > 0 && ekfÅr > 5 ? 2 : cashflowMd > 0 ? 1 : 0;
  const vurderingTekst = score === 2 ? "God investering" : score === 1 ? "Neutral investering" : "Dårlig investering";
  const vurderingStatus = score === 2 ? "god" : score === 1 ? "neutral" : "dårlig";

  // Returnerer alle de beregnede metrikker i et objekt, som kan bruges i renderingen af tabellen og vurderingen. Håndterer også tilfælde hvor visse metrikker ikke kan beregnes ved at returnere null for dem, så vi kan vise "—" i tabellen i stedet for at forsøge at vise et tal, der ikke giver mening.
  return {
    cashflowMd, cashflowÅr, ekfMd, ekfÅr, gældsgrad, samletInv, totalGæld,
    samletYdelse: samletYdelse > 0 ? samletYdelse : null,
    vurderingTekst, vurderingStatus, score,
    udlIndtægtMd: c.udlejning.udlejes ? c.udlejning.månedligLeje    : null,
    udlUdgiftMd:  c.udlejning.udlejes ? c.udlejning.månedligUdgifter : null
  };
}

// ── bedste/laveste i en kolonne ───────────────────────────────────────────────
// Finder indeksene for de bedste (højest eller lavest) værdier i en kolonne, og håndterer null/undefined ved at ignorere dem i sammenligningen, så de ikke fejlagtigt bliver betragtet som den bedste værdi.
function bedsteIndices(værdier, højest = true) {
  const med = værdier.map((v, i) => ({ v, i })).filter(x => x.v !== null && x.v !== undefined);
  if (med.length === 0) return new Set();
  const bedst = højest ? Math.max(...med.map(x => x.v)) : Math.min(...med.map(x => x.v));
  return new Set(med.filter(x => x.v === bedst).map(x => x.i));
}

// ── renderTabel ───────────────────────────────────────────────────────────────
//ved at rendere "—" for null/undefined værdier i stedet for at forsøge at vise et tal, der ikke giver mening, håndterer vi tilfælde hvor visse data ikke er tilgængelige eller relevante (f.eks. hvis ejendommen ikke udlejes, eller hvis egenkapitalen er 0), og sikrer at tabellen stadig ser pæn og informativ ud uden at vise forkerte eller misvisende tal.
function renderTabel(cases, metrikker) {
  const n = cases.length;

  //vi mapper gennem metrikkerne for hver kolonne og bruger bedsteIndices til at finde hvilke indeks der har den bedste værdi for den pågældende metrik, og gemmer disse i sæt som vi så kan bruge i celle() funktionen til at tilføje "best-value" klassen til de celler der har den bedste værdi i deres kolonne. Dette gør det nemt at fremhæve de bedste værdier i tabellen, selv når nogle værdier er null/undefined (som vi håndterer ved at ignorere dem i bedsteIndices funktionen).
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
//sørger for at rendere hver række i tabellen ved at mappe gennem cases og metrikker, og bruge celle() funktionen til at rendere hver celle i rækken, samtidig med at vi tjekker om den pågældende celle skal have "best-value" klassen baseret på om dens indeks er i det relevante sæt af bedsteIndices for den metrik, den repræsenterer. Dette gør det nemt at fremhæve de bedste værdier i tabellen, selv når nogle værdier er null/undefined (som vi håndterer ved at ignorere dem i bedsteIndices funktionen).
  function row(label, mapper, bedste) {
    return `<tr>
      <td class="row-label">${label}</td>
      ${cases.map((c, i) => celle(i, mapper(c, metrikker[i], i), bedste)).join("")}
    </tr>`;
  }

  // Sektioner i tabellen, som adskiller forskellige grupper af metrikker (f.eks. ejendom, økonomi, finansiering, simulering, vurdering), for at gøre det nemmere at overskue og forstå tabellen. Vi bruger sektionRow() funktionen til at rendere en række, der fungerer som en sektionstitel, og som strækker sig over alle kolonnerne i tabellen.
  function sektionRow(titel) {
    return `<tr class="section-row"><td colspan="${n + 1}">${titel}</td></tr>`;
  }

  // visLån() håndterer visningen af låneoplysninger i tabellen, inklusive beregning af månedlig ydelse for hvert lån, og formatering af låneoplysningerne på en pæn og informativ måde. Den håndterer også tilfælde hvor der ikke er et lån (lånObj er null), ved at returnere "—" i stedet for at forsøge at vise låneoplysninger, som ikke findes.
  function visLån(c, lånObj, titel) {
    if (!lånObj) return "—";
    const ydelse    = beregnMånedligYdelse(lånObj.beløb, lånObj.rente, lånObj.løbetid, lånObj.afdragsFriMåneder || 0);
    const afdragsFriTekst = (lånObj.afdragsFriMåneder || 0) > 0
      ? ` (${lånObj.afdragsFriMåneder} mdr. afdragsfrit)` : "";
    return `${formatKr(lånObj.beløb)}<br><small>${(lånObj.rente * 100).toFixed(2)}% · ${lånObj.løbetid} mdr.${afdragsFriTekst}</small><br><small>Ydelse: ${formatKr(Math.round(ydelse))}/md.</small>`;
  }

  const harLån = cases.some(c => c.realkreditlån || c.banklån || c.andrelån);

  // Render hele tabellen ved at kombinere alle de forskellige dele (sektioner, rækker, celler) og bruge de beregnede metrikker og bedsteIndices til at fremhæve de bedste værdier i tabellen. Vi håndterer også tilfælde hvor visse data ikke er tilgængelige eller relevante ved at vise "—" i de celler, hvor data ikke kan beregnes eller ikke giver mening, takket være vores håndtering af null/undefined værdier i både beregnMetrikker og bedsteIndices funktionerne.
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
//grafen tegnes med hjælp fra canvas API, hvor vi først definerer dimensionerne og padding for grafen, og derefter tegner baggrunden, gitterlinjer, akseetiketter, datapunkter og legend. Vi bruger også CSS-variabler til at hente farver og styling fra vores stylesheet, så grafen passer ind i det overordnede design af siden. Funktionen er fleksibel og kan håndtere forskellige antal serier og datapunkter, samt tilpasse sig forskellige størrelser på containeren.
function tegnLinjeGraf(container, serier, options = {}) {
  const W   = Math.min(container.clientWidth || 900, 1100);
  const H   = options.height || 300;
  const PAD = { top: 20, right: 20, bottom: 55, left: 90 };

  const canvas       = document.createElement("canvas");
  canvas.width       = W;
  canvas.height      = H;
  canvas.style.cssText = "width:100%;max-width:" + W + "px;display:block;border-radius:8px;";
  const ctx          = canvas.getContext("2d");

  const cs = getComputedStyle(document.documentElement);
  //sætter C-objektet til at hente farver og styling fra CSS-variabler, så grafen passer ind i det overordnede design af siden. Dette gør det nemt at ændre farver og styling for grafen ved blot at opdatere CSS-variablerne i vores stylesheet, uden at skulle ændre noget i JavaScript-koden for grafen.
  const C = {
    bg:       cs.getPropertyValue("--chart-bg").trim(),
    grid:     cs.getPropertyValue("--chart-grid").trim(),
    axisText: cs.getPropertyValue("--chart-axis-text").trim(),
    baseline: cs.getPropertyValue("--chart-baseline").trim(),
    label:    cs.getPropertyValue("--chart-label").trim(),
    //definere farverne fra global.css som CSS-variabler, og så hente dem ind i grafen via getComputedStyle, så vi kan bruge de samme farver i grafen som i resten af designet, og nemt ændre dem ved at opdatere CSS-variablerne i stedet for at skulle ændre farverne direkte i JavaScript-koden for grafen. Dette gør det også nemt at tilføje flere farver eller ændre farvepaletten for grafen ved blot at opdatere CSS-variablerne.
    farver: [
      cs.getPropertyValue("--chart-color-1").trim(),
      cs.getPropertyValue("--chart-color-2").trim(),
      cs.getPropertyValue("--chart-color-3").trim(),
      cs.getPropertyValue("--chart-color-4").trim(),
      cs.getPropertyValue("--chart-color-5").trim(),
      cs.getPropertyValue("--chart-color-6").trim(),
    ],
  };

  //const alleY, minY, maxY og spanY bruges til at beregne skalaen for y-aksen baseret på de data, der skal plottes i grafen. Ved at flade alle seriernes data ud i én array (alleY) og finde minimums- og maksimumværdierne (minY og maxY), kan vi bestemme det samlede spænd for y-aksen (spanY), så grafen kan tilpasses dynamisk til de data, der vises, uanset om de er positive, negative eller begge dele.
  const alleY = serier.flatMap(s => s.data);
  const minY  = Math.min(0, ...alleY);
  const maxY  = Math.max(...alleY, 1);
  const spanY = maxY - minY;

  //const xPos og yPos er funktioner, der konverterer dataindeks (i) og dataværdier (v) til pixelpositioner på canvaset, baseret på grafens dimensioner og padding. xPos beregner den horisontale position for et givent indeks i ved at fordele det jævnt mellem venstre og højre padding, mens yPos beregner den vertikale position for en given dataværdi v ved at skalere den i forhold til minY og spanY, og invertere den så højere værdier vises længere oppe på grafen.
  const xPos = i => PAD.left + (i / 29) * (W - PAD.left - PAD.right);
  const yPos = v => PAD.top  + (1 - (v - minY) / spanY) * (H - PAD.top - PAD.bottom);

  // Tegner baggrunden for grafen ved at fylde hele canvaset med baggrundsfarven defineret i CSS-variablerne, så grafen passer ind i det overordnede design af siden.
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  //sætter et for-loop til at tegne gitterlinjer og akseetiketter for y-aksen ved at iterere 6 gange (for t = 0 til 5) og beregne den tilsvarende dataværdi v for hver gitterlinje baseret på minY og spanY, og derefter tegne en vandret linje på grafen ved den beregnede y-position, samt tegne en etiket ved siden af linjen med den formaterede dataværdi. Dette gør det nemt at læse og forstå grafen ved at give visuelle referencer for dataværdierne på y-aksen.
  //teknisk gør den 6 iterationer for at tegne 5 gitterlinjer plus en ekstra linje ved minY, så vi får både en linje ved 0 og en linje ved maxY, uanset om de er positive, negative eller begge dele.
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

  //sørger for at alt ctx.textAlign er sat til "center" før vi tegner x-akse etiketterne, så de bliver centreret under de tilsvarende gitterlinjer på x-aksen. Dette gør det nemmere at læse og forstå grafen ved at sikre, at x-akse etiketterne er korrekt justeret i forhold til de data, de repræsenterer.
  ctx.textAlign = "center";

  //sætter endnu et for-loop til at tegne gitterlinjer og akseetiketter for x-aksen ved at iterere gennem årene 5, 10, 15, 20, 25 og 30, og for hver år beregne den tilsvarende x-position ved hjælp af xPos funktionen, og derefter tegne en vertikal linje på grafen ved den beregnede x-position, samt tegne en etiket under linjen med teksten "År " efterfulgt af årstallet. Dette gør det nemt at læse og forstå grafen ved at give visuelle referencer for dataværdierne på x-aksen, som i dette tilfælde repræsenterer år.
  for (let år = 5; år <= 30; år += 5) {
    const x = xPos(år - 1);
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, H - PAD.bottom); ctx.stroke();
    ctx.fillStyle = C.axisText; ctx.font = "11px Arial";
    ctx.fillText("År " + år, x, H - PAD.bottom + 14);
  }

  if (minY < 0) {
    const y0 = yPos(0);
    ctx.strokeStyle = C.baseline; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(PAD.left, y0); ctx.lineTo(W - PAD.right, y0); ctx.stroke();
    ctx.setLineDash([]);
  }

  //En foreach for at tegne hver serie i grafen ved at iterere gennem serierne og for hver serie bestemme farven (enten fra serien selv eller fra det definerede farvearray), og derefter tegne en linje gennem datapunkterne i serien ved hjælp af ctx.lineTo for at forbinde punkterne, og til sidst stroke() for at tegne linjen på canvaset. Vi håndterer også tilfælde hvor serien er stiplet ved at sætte line dash mønsteret, og sørger for at nulstille det efter hver serie, så det ikke påvirker de efterfølgende serier. Dette gør det nemt at visualisere og sammenligne flere dataserier i samme graf, med klar differentiering mellem dem gennem brug af farver og linjestil.
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

  //sætter kol, lx0, ly0 og forEach for at tegne legend for grafen ved at iterere gennem serierne og for hver serie bestemme farven (enten fra serien selv eller fra det definerede farvearray), og derefter tegne en lille firkant i den tilsvarende farve ved hjælp af fillRect, og tegne etiketten for serien ved siden af firkanten ved hjælp af fillText. Vi beregner også positionen for legend baseret på antallet af serier og grafens dimensioner, så den tilpasser sig dynamisk til forskellige antal serier og størrelser på containeren. Dette gør det nemt at forstå hvilken linje i grafen der repræsenterer hvilken serie, ved at give en klar og informativ legend.
  const kol = Math.max(1, Math.floor((W - PAD.left - PAD.right) / 200));
  const lx0 = PAD.left;
  const ly0 = H - PAD.bottom + 28;
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

// ── render30ÅrSammenligning ───────────────────────────────────────────────────
/*
Sammenligner cashflow, akkumuleret cashflow, restgæld og egenkapital for flere cases over en 30-årig periode, og genererer en HTML-tabel med resultaterne. Funktionen håndterer også tilfælde hvor visse data ikke er tilgængelige eller relevante ved at vise "—" i de celler, hvor data ikke kan beregnes eller ikke giver mening, takket være vores håndtering af null/undefined værdier i beregnMetrikker og bedsteIndices funktionerne. Den returnerer både HTML-koden for tabellen og de akkumulerede cashflow- og egenkapitaldata, som kan bruges til at tegne grafer baseret på disse data.
*/
function render30ÅrSammenligning(cases) {
  const cashflowsÅr    = cases.map(c => {
    const driftsMd = c.driftsOmkostninger || 0;
    return c.udlejning.udlejes
      ? (c.udlejning.månedligLeje - c.udlejning.månedligUdgifter - driftsMd) * 12
      : -driftsMd * 12;
  });
  //sætter const kr, akkumulerede, alleCFData, alleEKData og rækker for at formatere værdier som danske kroner, holde styr på akkumulerede cashflow for hver case, og generere HTML-rækkerne for tabellen. Funktionen itererer gennem årene 1 til 30, og for hvert år opdaterer den akkumulerede cashflow, beregner restgæld og egenkapital for hver case, og tilføjer en række til tabellen med disse værdier. Den markerer også milepæle (hver 5 år) med en særlig klasse for at gøre det nemmere at se disse i tabellen.
  const kr             = v => Math.round(v).toLocaleString("da-DK") + " kr.";
  const akkumulerede   = cases.map(() => 0);
  const alleCFData     = cases.map(() => []);
  const alleEKData     = cases.map(() => []);
  let rækker           = "";

  //sætter et for-loop til at iterere gennem årene 1 til 30, og for hvert år opdaterer den akkumulerede cashflow for hver case ved at tilføje det årlige cashflow, beregner restgæld for hver case ved at summere restgælden for alle lån (realkreditlån, banklån, andre lån) ved hjælp af restgældEfterÅr funktionen, og beregner egenkapitalen for hver case som købspris minus restgæld. Derefter tilføjer den en række til HTML-tabellen med disse værdier, og markerer milepæle (hver 5 år) med en særlig klasse "sim30-milepæl" for at gøre det nemmere at se disse i tabellen.
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

    //for each loopet her tilføjer de akkumulerede cashflow og egenkapital data for hver case til alleCFData og alleEKData arrays, som vi senere kan bruge til at tegne grafer baseret på disse data. Dette gør det nemt at visualisere udviklingen af cashflow og egenkapital over tid for hver case, ved at have disse data struktureret på en måde, der er let at arbejde med for graftegning.
    cases.forEach((_, i) => {
      alleCFData[i].push(akkumulerede[i]);
      alleEKData[i].push(egenkapitaler[i]);
    });

    //sætter html for hver række i tabellen ved at iterere gennem cases og bruge kr() funktionen til at formatere cashflow, akkumuleret cashflow, restgæld og egenkapital som danske kroner, og tilføje disse værdier i de tilsvarende celler i rækken. Vi markerer også milepæle (hver 5 år) med en særlig klasse "sim30-milepæl" for at gøre det nemmere at se disse i tabellen.
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

  //returnerer både HTML-koden for tabellen og de akkumulerede cashflow- og egenkapitaldata, som kan bruges til at tegne grafer baseret på disse data. Dette gør det nemt at både vise resultaterne i en tabel og visualisere dem i grafer, ved at have alle nødvendige data tilgængelige i det returnerede objekt.
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
//Sørger for at alt indhold på siden er indlæst, før vi forsøger at hente data, beregne metrikker og manipulere DOM'en for at vise sammenligningen. Dette sikrer, at alle elementer, som vi har brug for at interagere med (f.eks. "sammenlignIndhold", "sim30Btn", "sim30Result", "sam30Graf"), er tilgængelige og klar til at blive opdateret med de relevante data og event listeners.
//Vi starter med en eventlistener der er sat op med params, ids, alleCases, cases og indhold. Vi tjekker først om der er mindst 2 cases at sammenligne, og hvis ikke viser vi en fejlbesked. Hvis der er nok cases, beregner vi metrikkerne for hver case og renderer tabellen med disse metrikker. Vi gør også simuleringssektionen synlig, og sætter en eventlistener på simuleringsknappen, som når den klikkes, enten viser eller skjuler 30-års simuleringen ved at opdatere innerHTML og display-stil for resultatelementet, og tegner grafen hvis simuleringen vises.
document.addEventListener("DOMContentLoaded", async () => {
  const params    = new URLSearchParams(window.location.search);
  const ids       = (params.get("ids") || "").split(",").map(Number).filter(Boolean);
  const alleCases = await hentCases();
  //cases variablen indeholder de cases, som brugeren har valgt at sammenligne, baseret på "ids" parameteren i URL'en. Vi finder disse cases ved at matche id'erne i URL'en med id'erne i alleCases arrayet, og filtrerer for at sikre, at vi kun får gyldige cases (filter(Boolean) fjerner eventuelle undefined værdier, hvis et id ikke matcher nogen case).
  const cases     = ids.map(id => alleCases.find(c => Number(c.id) === id)).filter(Boolean);
  const indhold   = document.getElementById("sammenlignIndhold");

  //hvis der er under 2 cases, viser vi en fejlbesked i indholdselementet, som informerer brugeren om, at de skal vælge mindst 2 cases for at kunne sammenligne, og giver dem et link til at gå tilbage til sammenligningssiden. Vi returnerer derefter for at stoppe yderligere eksekvering af koden, da vi ikke kan vise en sammenligning uden mindst 2 cases.
  if (cases.length < 2) {
    indhold.innerHTML = `
      <p class="fejl-tekst">Mindst 2 cases skal vælges.
        <a href="/compare.html" class="tilbage-link">← Gå tilbage</a>
      </p>`;
    return;
  }

  //beregner metrikkerne for hver case ved at mappe gennem cases arrayet og anvende beregnMetrikker funktionen på hver case. Dette giver os et nyt array (metrikker) hvor hver element indeholder de beregnede metrikker for den tilsvarende case, som vi senere kan bruge til at render tabellen og fremhæve de bedste værdier.
  const metrikker  = cases.map(beregnMetrikker);
  indhold.innerHTML = renderTabel(cases, metrikker);

  //gør simuleringssektionen synlig ved at sætte display-stilen for elementet med id "sim30Sektion" til "block". Dette gør det muligt for brugeren at se og interagere med knappen for at simulere cashflow over 30 år, som vi sætter en event listener på i det følgende.
  document.getElementById("sim30Sektion").style.display = "block";

  //sætter en event listener på knappen med id "sim30Btn", som når den klikkes, enten viser eller skjuler 30-års simuleringen ved at opdatere innerHTML og display-stil for resultatelementet, og tegner grafen hvis simuleringen vises. Vi bruger render30ÅrSammenligning funktionen til at generere HTML-koden for tabellen og de akkumulerede cashflow- og egenkapitaldata, som vi så kan bruge til at opdatere DOM'en og tegne grafen baseret på disse data.
  document.getElementById("sim30Btn").addEventListener("click", () => {
    const result = document.getElementById("sim30Result");
    const btn    = document.getElementById("sim30Btn");

    const grafDiv = document.getElementById("sam30Graf");

    //hvis result.innerHTML allerede har indhold (dvs. at simuleringen allerede vises), så rydder vi det og skjuler det, og opdaterer knapteksten til at invitere brugeren til at simulere igen. Hvis result.innerHTML er tomt (dvs. at simuleringen ikke vises), så genererer vi HTML-koden for tabellen og de akkumulerede cashflow- og egenkapitaldata ved at kalde render30ÅrSammenligning, og opdaterer DOM'en for at vise tabellen og tegne grafen baseret på disse data. Vi opdaterer også knapteksten til at give brugeren mulighed for at skjule simuleringen igen.
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

      //hvis grafdiv er tilgængelig, rydder vi dens indhold og tegner en linjegraf ved hjælp af tegnLinjeGraf funktionen, hvor vi sender grafDiv som container, og en array af serier som indeholder både cashflow og egenkapital data for hver case, med passende labels og farver. Dette giver brugeren en visuel repræsentation af udviklingen af cashflow og egenkapital over tid for hver case, hvilket kan gøre det nemmere at forstå og sammenligne resultaterne.
      if (grafDiv) {
        grafDiv.innerHTML = "";
        const caseKolorer = ["var(--primary-color)", "var(--secondary-color)", "var(--accent-color)"];
        const serier = [];
        //forEach loopet her tilføjer både cashflow og egenkapital data for hver case til serier arrayet, som vi senere kan bruge til at tegne grafer baseret på disse data. Vi giver hver serie en label, der inkluderer casens navn og om det er cashflow eller egenkapital, og vi tildeler farver baseret på caseKolorer arrayet, så hver case har en konsistent farve for både cashflow og egenkapital, hvilket gør det nemmere at skelne mellem dem i grafen.
        cases.forEach((c, i) => {
          serier.push({ label: c.navn + " — cashflow",    data: alleCFData[i], farve: caseKolorer[i % caseKolorer.length] });
          serier.push({ label: c.navn + " — egenkapital", data: alleEKData[i], farve: caseKolorer[i % caseKolorer.length], stiplet: true });
        });

        // Tegner linjegrafen ved at kalde tegnLinjeGraf funktionen med grafDiv som container, og serier arrayet som indeholder både cashflow og egenkapital data for hver case, med passende labels og farver. Vi sætter også en specifik højde for grafen via options parameteren, så den passer godt ind i layoutet af siden.
        tegnLinjeGraf(grafDiv, serier, { height: 320 });
      }
    }
  });
});
