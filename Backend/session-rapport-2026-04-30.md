# Sessionsrapport — 2026-04-30

Dokumenterer alt udviklingsarbejde fra dagens session og giver overblik over hvad der stadig mangler for at projektet er klar til aflevering.

---

## Del 1 — Hvad blev lavet i dag

### 1.1 Simulerings-stabilitet: låndata via localStorage

**Problem:** Backend-GET-endpointet returnerer ikke data fra `Laan`-tabellen, så alle simuleringsberegninger var brudt (restgæld = 0, cashflow = 0 osv.).

**Løsning:** Implementeret et localStorage-supplement-lag i `investeringscase.js` og `sammenlign.js`:
- Efter POST/PUT gemmes alle låndata under nøglen `invCase_loans_<caseID>` i JSON-format
- `hentCase()` og `hentCases()` supplerer API-svaret med disse lokale data
- Rente gemmes som decimal (0.035), løbetid i måneder — præcist nok til alle beregninger

**Berørte filer:** `Frontend/js/investeringscase.js`, `Frontend/js/sammenlign.js`, `Frontend/js/ejendom.js`

---

### 1.2 Afdragsfri periode — nyt felt i wizard og alle visninger

**Tilføjet i wizard (Trin 4):**
- Tre nye felter: `mortgageAfdragsFri`, `bankLoanAfdragsFri`, `otherLoansAfdragsFri` (antal måneder)
- Sættes til 0 som standard, ingen validering kræver udfyldelse

**Tilføjet i investeringscase-detaljer (`investeringscase.html`):**
- Viser afdragsfri periode i måneder og år per lån
- Viser ydelse i afdragsfri periode (kun rente) separat fra ydelse efter perioden

**Tilføjet i sammenligning (`sammenlign.html`):**
- Afdragsfri periode vises per lån med teksten `(X mdr. afdragsfrit)` under beløbet

**Beregningslogik:**
```
Ydelse i afdragsfri periode = beløb × (rente / 12)
Ydelse efter periode = beløb × (rente/12) / (1 − (1 + rente/12)^−amortMdr)
  hvor amortMdr = løbetid − afdragsFriMdr
```

**Berørte filer:** `Frontend/public/ejendom.html`, `Frontend/js/ejendom.js`, `Frontend/js/investeringscase.js`, `Frontend/js/sammenlign.js`

---

### 1.3 Live ydelsesvisning i wizard

**Implementeret:** Grøn boks (`ydelse-info-boks`) under hvert lån i Trin 4 viser:
- Ydelse i afdragsfri periode (kun rente)
- Ydelse efter afdragsfri periode (fuld annuitet)

Opdateres live når beløb, rente, løbetid eller afdragsfri ændres.

**Tilføjede funktioner i `ejendom.js`:**
- `beregnMånedligYdelseWizard(beløb, rente, løbetidMdr, afdragsFriMdr)`
- `beregnRenteYdelseWizard(beløb, rente)`
- `opdaterYdelseDisplay(...)` — opdaterer én låne-boks
- `refreshAlleYdelser()` — kører opdatering på alle tre lån

**Berørte filer:** `Frontend/js/ejendom.js`, `Frontend/public/ejendom.html`, `Frontend/css/ejendom.css`

---

### 1.4 Canvas-linjegraf over 30-årig udvikling

**Implementeret uden biblioteker** via native HTML5 Canvas API:
- Funktion `tegnLinjeGraf(container, serier, options)` i både `investeringscase.js` og `sammenlign.js`
- Auto-skalering af y-aksen (viser mio., k eller heltal afhængigt af interval)
- Gitterlinjer, nul-linje ved negative værdier, år-mærker hvert 5. år, legende
- Stiplet linje bruges til egenkapital, solid til cashflow

**Single-case (`investeringscase.html`):**
- Graf under 30-årstabellen med akkumuleret cashflow + egenkapital

**Sammenligning (`sammenlign.html`):**
- Graf i `#sam30Graf`-container under sammenligningstabellen
- En farve per case, solid = cashflow, stiplet = egenkapital
- Op til 3 cases vises i samme graf

**Fix — grafduplikering:** Graf-containere ryddes (`innerHTML = ""`) både når man skjuler og inden man tegner, så canvas ikke akkumuleres ved gentagne åbn/luk.

**Berørte filer:** `Frontend/js/investeringscase.js`, `Frontend/js/sammenlign.js`, `Frontend/public/sammenlign.html`, `Frontend/css/investeringscase.css`, `Frontend/css/sammenlign.css`

---

### 1.5 30-årstabel — begivenheder og refinansieringsanalyse

Tilføjet kolonne "Begivenheder" i 30-årstabellen der markerer:
- `[Låntype]: afdragsfri periode slutter` — ved det år hvor afdragsfri periode udløber
- `[Låntype] fuldt indfriet — refinansieringsmulighed` — ved det år lånet er færdigbetalt

Vises som badges (`begivenhed-badge`) i tabellens sidste kolonne.

---

### 1.6 "Er du sikker?" finansieringscheck — komplet omskrivning

**Tidligere:** Sammenlignede finansiering kun mod `koebsPris`, viste advarslen live og indsatte den øverst i formularen.

**Nu:**
- Sammenligner finansiering mod `totalKoebsOmk = koebsPris + advokat + tinglysning + koeberRaadgivning + andreOmkostninger` (driftsomkostninger er eksplicit ekskluderet — de er løbende, ikke engangsomkostninger)
- Advarslen vises **kun** ved klik på Næste (`#bekraeftFinansiering()`) — ikke live
- Første klik med mismatch: viser advarsel under formularen (via `appendChild`, ikke `prepend`), blokerer navigation
- Andet klik: lader brugeren gå videre uanset
- `#tjekFinansieringBalance()` bruges nu kun til at **fjerne** en eksisterende advarsel når tallene passer — opretter ingen advarsel live

---

### 1.7 Realkreditlån-placeholder — 80%-regel og banklån-hint

**Ændring i `updateMortgagePlaceholder()`:**
- Foreslået realkreditlån = `min(koebsPris − egenkapital, 0.8 × koebsPris)`
- Placeholder: `"X kr. (maks 80% af kpris)"` frem for den tidligere beregning der fejlagtigt lagde handelsomkostninger oven i lånebeløbet

**Nyt bankLoanHint-element:**
- Gul advarselsboks (`#bankLoanHint`) vises automatisk når egenkapital < 20% af koebsPris
- Tekst: "Din egenkapital er under 20% af købsprisen — overvej at supplere med et banklån"

**Berørte filer:** `Frontend/js/ejendom.js`, `Frontend/public/ejendom.html`

---

### 1.8 Driftsomkostninger — ændret til månedlig enhed

**Label:** Ændret fra "Driftsomkostninger (DKK)" til "Driftsomkostninger pr. måned (DKK/md.)" i Trin 2.
Tooltip opdateret tilsvarende.

**Beregningslogik:** `driftsOmkostninger` bruges nu direkte som månedligt beløb i alle cashflow-beregninger:

```
månedligtCashflow = månedligLeje − månedligUdgifter − driftsOmkostninger
```

Gælder i:
- `renderSimulationTabel()` — basisberegning
- `render30ÅrTabel()` — 30-årig tabel
- `renderInvestmentCaseDetails()` — cashflow i udlejningssektion
- `beregnMetrikker()` i sammenlign.js — sammenligningstabel og 30-årig sammenligning

**Displays** er opdateret fra "Driftsomkostninger/år" til "Driftsomkostninger/md." alle steder.

---

### 1.9 InvesteringWizard — komplet klasse i ejendom-wizard.js

Wizarden er implementeret som en JavaScript-klasse (`InvesteringWizard`) med private felter og metoder:

| Privat felt/metode | Formål |
|---|---|
| `#currentStep` | Holder styr på aktivt trin |
| `#totalSteps` | Konstant: 5 trin |
| `#finansieringAdvaret` | Flag der styrer "anden chance" ved finansieringsmismatch |
| `#bindNavigation()` | Tilknytter Næste/Tilbage click events |
| `#validerNuvaaerendeTrin()` | Validerer required-felter i aktivt trin |
| `#bekraeftFinansiering()` | Viser finansieringsadvarsel ved klik på Næste |
| `#tjekFinansieringBalance()` | Fjerner advarsel når tallene passer |
| `#opsaetValideringsListeners()` | Live-validering med popup-beskeder |
| `#visPopup()` / `#skjulPopup()` | Rød popup over ugyldig input |
| `#opdaterProgress()` | Opdaterer progress bar og undertitel |
| `#opdaterKnapper()` | Skifter Næste til Submit på trin 5 |

---

### 1.10 CSS-tilføjelser

**`ejendom.css`:** `.ydelse-info-boks`, `.ydelse-info-label`, `.finansiering-advarsel`, `.wizard-*` klasser, `.validerings-popup`

**`investeringscase.css`:** `.detalje-grid`, `.detalje-sektion`, `.laan-detalje`, `.laan-titel`, `.laan-total`, `.graf-container`, `.graf-overskrift`, `.begivenhed-celle`, `.begivenhed-badge`

**`sammenlign.css`:** `.graf-container`, small-tekst i lånceller

---

## Del 2 — Hvad mangler for at projektet er færdigt

Baseret på opgavebeskrivelsen og `tjekliste.md` (opdateret efter dagens arbejde):

---

### Kritiske mangler (direkte krav der ikke er dækket)

#### ❌ 1. Unit tests — 3 kritiske units

Opgaven kræver eksplicit 3 unit tests. Ingen tests eksisterer i projektet.

**Gode kandidater:**
- `beregnMånedligYdelse()` — annuitetsformlen med og uden afdragsfri periode
- `restgældEfterÅr()` — kontrollér korrekt afdragsprofil over tid
- Cashflow-beregning — leje minus udgifter minus driftsomkostninger

**Sådan gøres det:** Opret `Backend/tests/beregninger.test.js`, brug `node:assert` (ingen ekstra pakker) eller `jest` (`npm install jest --save-dev`). Alternativt en simpel browser-test-fil i Frontend.

---

#### ❌ 2. Duplikering af investeringscase

Krav 5.4: "Mulighed for at genbruge og modificere tidligere cases."

**Sådan gøres det:** Tilføj en "Kopiér case"-knap på `investeringscase.html`. Den sætter `caseData` i `localStorage` som `editCase` (det samme flow som edit-mode), rydder `id`-feltet, og sender til `ejendom.html`. POST opretter ny case med `" (kopi)"` tilføjet til navnet.

---

#### ❌ 3. Rediger ejendomsprofil

Krav 1.6: "Mulighed for at ændre en eksisterende ejendomsprofil."

Kun investeringscases kan redigeres — ikke selve ejendomsprofilen (adresse, BBR-data, navn).

**Sådan gøres det:** En "Rediger"-knap på ejendomsprofilkortet i `propertyGrid.js` der åbner et modal med redigerbare felter. Kræver en PUT-endpoint på `ejendomsprofilRoute.js` (tjek om den allerede eksisterer).

---

#### ❌ 4. Teknisk rapport-dokumentation

Alle 6 tekniske dokumentationskrav mangler:

| Krav | Hvad der kræves |
|------|-----------------|
| D.1 | ER-diagram med normalisering (appendix) |
| D.2 | Arkitektur-beskrivelse: Frontend ↔ API ↔ DB |
| D.3 | Sekvensdiagram eller flowchart for ét komplekst brugerflow |
| D.4 | Forretningslogik med pseudokode (cashflow-beregning er oplagt) |
| D.5 | API-design-dokument med mindst 2 endpoints (request/response-eksempler) |
| D.6 | 3 fejlscenarier dokumenteret med systemets håndtering og bruger-feedback |

---

#### ❌ 5. Video-gennemgang (Loom)

Max 10 minutter. Skal gennemgå alle funktionelle krav i den rækkefølge de er stillet. Linkes fra rapporten. Laves sidst.

---

### Bør poleres (delvise implementeringer)

#### ⚠️ 6. Adresse-valideringsfejlbesked

Hvis DAWA API er nede eller returnerer tomt, vises ingen synlig fejlbesked til brugeren. Opgaven kræver "validering med fejlhåndtering mod API".

**Fix:** I `bbrService.js`, vis `"Ingen adresser fundet"` eller `"API-fejl — prøv igen"` i et `<p>`-element under søgefeltet ved `data.length === 0` eller `.catch()`.

---

#### ⚠️ 7. Kodeduplikering: `hentCases()` i compare.js og sammenlign.js

Vedligeholdbarhedskrav — samme funktion er kopieret. `cases.js` eksisterer allerede og kan bruges som fælles modul.

**Fix:** Flyt `hentCases()` til `cases.js`, tilføj `<script src="/js/cases.js">` i `compare.html` og `sammenlign.html`.

---

#### ⚠️ 8. Grundareal bruger forkert BBR-felt

`byg041BebyggetAreal` (bebygget areal) bruges i stedet for jordstykkets `registreretareal`. Opgaven kræver grundareal (m²).

**Fix:** Tjek at backend-routen returnerer `registreretareal` og at `index.js` bruger det korrekte felt.

---

#### ⚠️ 9. README-fuldstændighed

Formelt krav — README skal vise præcis hvordan systemet køres lokalt.

**Tjek at README indeholder:** `npm install`, `.env`-opsætning med påkrævede variabler, `node Backend/server.js`, og hvilken port der bruges.

---

#### ⚠️ 10. Backend-ændringer for fuld datapersistering

Alle nye felter fra dagens session er persisteret via localStorage som midlertidig løsning. For at låndata, afdragsfri periode og driftsomkostninger gemmes permanent i databasen kræves de ændringer der er dokumenteret i `backend-changes.md`:

- `ALTER TABLE Laan ADD afdragsFriMaaneder INT NOT NULL DEFAULT 0`
- `ALTER TABLE Laan ADD laanNummer INT NOT NULL DEFAULT 1`
- `ALTER TABLE KoebsOmkostninger ADD driftsOmkostninger DECIMAL(10,2) NOT NULL DEFAULT 0`
- GET-query udvidet med `LEFT JOIN Laan l1/l2/l3` for de tre låntyper

---

### Opdateret status-oversigt

| Kategori | ✅ Lavet | ⚠️ Delvist | ❌ Mangler |
|----------|---------|-----------|----------|
| Funktionelle krav (1.1–5.4) | 25 | 4 | 2 |
| Ikke-funktionelle krav | 4 | 3 | 2 |
| Teknisk dokumentation | 0 | 0 | 6 |
| Video | 0 | 0 | 1 |

**Vigtigst at gøre FØR aflevering:**
1. Unit tests (3 stk.) — eksplicit eksamenskrav
2. Duplikering af investeringscase — eksplicit eksamenskrav
3. Rediger ejendomsprofil — eksplicit eksamenskrav
4. Teknisk dokumentation i rapporten (ER-diagram, arkitektur, API-dok, pseudokode, fejlscenarier)
5. Video-gennemgang
