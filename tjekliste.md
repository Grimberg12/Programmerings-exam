# Eksamenstjekliste — Ejendomsinvesterings-app
> Sidst opdateret: 2026-04-30

Legende: ✅ Lavet · ⚠️ Delvist/tolkning · ❌ Mangler

---

## 1. Forside / Adressesøgning

| # | Krav | Status | Note |
|---|------|--------|------|
| 1.1 | Søg efter ejendom via dansk adresse | ✅ | `bbrService.js` + DAWA API |
| 1.2 | Validering af adresse med fejlhåndtering mod API | ⚠️ | Dropdown viser kun gyldige DAWA-adresser — ingen eksplicit fejlbesked hvis API fejler |
| 1.3 | Vis relevant data fra API ved gyldig adresse | ✅ | BBR-data (type, år, areal, værelser, grundareal) vises i preview |
| 1.4 | Mulighed for at oprette ejendomsprofil fra søgeresultat | ✅ | "Opret ejendomsprofil"-knap sender til `/ejendom.html` |
| 1.5 | Overblik over tidligere ejendomsprofiler med metadata | ✅ | `propertyGrid.js` viser oprettelsesdato, sidst ændret og antal cases |
| 1.6 | Mulighed for at ændre en eksisterende ejendomsprofil | ❌ | Ingen "rediger ejendomsprofil"-knap/modal på forsiden eller ejendomssiden. Kun investeringscase kan redigeres |
| 1.7 | Mulighed for at fjerne en eksisterende ejendomsprofil | ✅ | "Slet"-knap i `propertyGrid.js` med bekræftelsesdialog |

---

## 2. Ejendomsprofiler

| # | Krav | Status | Note |
|---|------|--------|------|
| 2.1 | Adresse (vejnavn, husnummer, postnummer, bynavn) | ✅ | Vises på `ejendom.html` |
| 2.2 | Ejendomstype fra BBR | ✅ | `byg021BygningensAnvendelse` oversættes til dansk |
| 2.3 | Byggeår fra BBR | ✅ | `byg026*`-felt |
| 2.4 | Boligareal (m²) fra BBR | ✅ | `enh026EnhedensSamledeAreal` |
| 2.5 | Antal værelser fra BBR | ✅ | `enh031AntalVærelser` |
| 2.6 | Grundareal (m²) fra BBR | ⚠️ | Bruger `byg041BebyggetAreal` (bebygget areal) i stedet for jordstykkets `registreretareal` — kan være forkert felt |
| 2.7 | Kortvisning — luftfoto | ✅ | WMS-kald via backend proxy, vises som `<img>` |
| 2.8 | Kortvisning — matrikelkort | ✅ | WMS-kald via backend proxy, vises side om side med luftfoto |
| 2.9 | Initialisere ny investeringscase med navn og beskrivelse | ✅ | "Opret ny investeringscase"-knap åbner wizard |

---

## 3. Investeringscases — guidet formular (5 trin)

| # | Krav | Status | Note |
|---|------|--------|------|
| 3.0 | Struktureret formular i 5 sider | ✅ | `InvesteringWizard`-klasse i `ejendom-wizard.js` |
| 3.0 | Validering og vejledning i input | ✅ | Custom popup-validering, finansieringsadvarsel, tooltips på alle felter |
| 3.1 | Ejendomspris, advokat, tinglysning, køberrådgivning | ✅ | Trin 2 i wizard → `KoebsOmkostninger`-tabel |
| 3.1 | Variabelt antal parametre inkluderes i analyse | ⚠️ | Fast sæt af felter — ikke dynamisk tilføjelse af købsomkostninger |
| 3.1 | Tallene kan ændres og opdateres | ✅ | Edit-mode via `localStorage` + PUT `/api/v1/investment-cases/:id` |
| 3.2 | Lånebeløb, rente, løbetid, type | ✅ | Trin 4, op til 3 lån → `Laan`-tabel |
| 3.2 | Afdragsfri periode | ❌ | Ikke implementeret — ingen felt eller DB-kolonne |
| 3.2 | Månedlige ydelser, total renteomkostning i cashflow | ⚠️ | Restgæld beregnes med annuitetsformel, men månedlig ydelse vises ikke separat |
| 3.3 | Tilvalg af renovering med tidspunkt | ✅ | Trin 3, dynamisk tilføjelse med navn, pris og dato → `Renovation`-tabel |
| 3.3 | Udgifter til renovering indgår i samlet analyse | ✅ | `renoveringsomkostninger` summeres og vises på `investeringscase.html` |
| 3.4 | Løbende driftsomkostninger | ✅ | `driftsOmkostninger`-felt i trin 2, gemmes i `Renovation` |
| 3.4 | Sammenlægning månedligt og årligt niveau | ⚠️ | Driftsomkostninger gemmes men vises ikke opdelt md/år i simuleringen |
| 3.5 | Udlejning til-/fravalg | ✅ | Trin 5, `rental`-select → `Udlejning`-tabel |
| 3.5 | Månedlige lejeindtægter og -udgifter i cashflow | ✅ | Bruges i `renderSimulationTabel()` og 30-årig tabel |
| 3.5 | Overblik over månedlige og årlige lejeindtægter/udgifter | ✅ | Vises i simuleringsskemaet |

---

## 4. Simulering og visualisering

| # | Krav | Status | Note |
|---|------|--------|------|
| 4.1 | Simulering over mindst 30 år | ✅ | `render30ÅrTabel()` i `investeringscase.js` |
| 4.2 | Egenkapital over tid | ✅ | Beregnes som Købspris − Restgæld pr. år |
| 4.2 | Cashflow over tid | ✅ | Vises pr. år + akkumuleret |
| 4.2 | Gæld over tid | ✅ | Restgæld beregnes med annuitetsformel |
| 4.3 | Visualisering af simuleringsresultater | ⚠️ | Tabel vises — **ingen graf/diagram**. Opgaven siger "grafer, diagrammer og/eller tabeller efter eget valg" — tabellen er teknisk nok, men en graf ville styrke det visuelt |

---

## 5. Scenarier og sammenligning

| # | Krav | Status | Note |
|---|------|--------|------|
| 5.1 | Sammenligne cases på tværs af ejendomsprofiler | ✅ | `compare.js` → `sammenlign.js`, op til 3 cases |
| 5.2 | Meningsfuld sammenligning | ✅ | Tabel med cashflow, egenkapital, gældsgrad, vurdering — bedste værdi fremhæves |
| 5.3 | 30-årig sammenligning | ✅ | `render30ÅrSammenligning()` i `sammenlign.js` |
| 5.4 | Duplikering / genbrug af cases | ❌ | Ingen "kopiér case"-knap eller funktionalitet |

---

## Ikke-funktionelle krav

### Vedligeholdbarhed

| # | Krav | Status | Note |
|---|------|--------|------|
| 6.1 | Konsistent navngivningskonvention | ⚠️ | Generelt konsistent dansk/camelCase, men `investeringscase.js` blander dansk og engelsk |
| 6.2 | Undgå kodeduplikering | ⚠️ | `hentCases()` er kopieret identisk i `compare.js` og `sammenlign.js` |
| 6.3 | Fejlhåndtering | ✅ | Global `errorHandler.js`, try/catch i alle async-funktioner, 404-handler |
| 6.4 | Klasser med metoder i JS | ✅ | `InvesteringWizard`-klassen med private felter og metoder |

### Test og testbarhed

| # | Krav | Status | Note |
|---|------|--------|------|
| 7.1 | Beskriv overordnet teststrategi | ❌ | Ingen testfil eller dokumentation |
| 7.2 | 3 unit tests af kritiske units | ❌ | Ingen unit tests overhovedet |

### Usability

| # | Krav | Status | Note |
|---|------|--------|------|
| 8.1 | Brugervenligt interface | ✅ | Wizard, tooltips, validering, feedback-beskeder |
| 8.2 | Ens og gennemgående brugerinterface | ✅ | `color.css` med CSS-variabler bruges på alle sider, fælles header/footer |

### Setup og eksekvering

| # | Krav | Status | Note |
|---|------|--------|------|
| 9.1 | README med instruktioner til at køre lokalt | ⚠️ | `README.md` eksisterer — men indhold er ikke tjekket for fuldstændighed |

---

## Teknisk dokumentation (rapport)

| # | Krav | Status | Note |
|---|------|--------|------|
| D.1 | ER-diagram med normalisering | ❌ | Mangler |
| D.2 | Arkitektur-beskrivelse (Frontend + API + DB) | ❌ | Mangler |
| D.3 | Sekvensdiagram eller flowchart | ❌ | Mangler |
| D.4 | Forretningslogik med pseudokode | ❌ | Mangler (cashflow-beregning er et oplagt eksempel) |
| D.5 | API-design-dokument med 2+ endpoints | ❌ | Mangler |
| D.6 | 3 fejlscenarier dokumenteret | ❌ | Mangler |

---

## Videodemonstration

| # | Krav | Status | Note |
|---|------|--------|------|
| V.1 | Max 10 min. Loom-video der viser alle funktionelle krav | ❌ | Skal laves til sidst |

---

## Prioriteret liste over hvad der mangler

### ❌ Kritisk — direkte krav der ikke er dækket

---

#### 1. Unit tests (3 stk.)
**Sværhedsgrad:** Middel  
**Hvad det gør:** Beviser at kritiske beregninger virker korrekt og opfylder eksamenskravet om testbarhed.  
**Kom i gang:** Lav en fil `Backend/tests/beregninger.test.js`. Gode kandidater: annuitetsformlen (`restgældEfterÅr`), cashflow-beregning og egenkapitalforrentning. Brug fx `node:assert` (ingen ekstra pakker) eller installer `jest` med `npm install jest --save-dev`.  
**Strukturændring:** Nej — bare en ny testfil.

---

#### 2. Duplikering af investeringscase
**Sværhedsgrad:** Let–middel  
**Hvad det gør:** Lader brugeren kopiere en eksisterende case og modificere den til en ny variant — krav 5.4 i opgaven.  
**Kom i gang:** Tilføj en "Kopiér"-knap på `investeringscase.html` der læser `caseData`, sætter det i `localStorage` som `editCase` (som edit-mode allerede gør), og sender til `ejendom.html`. POST opretter en ny case med samme værdier. Eneste forskel fra edit: ID skal ikke sendes med, og caseNavn får " (kopi)" tilføjet.  
**Strukturændring:** Nej — genbruger eksisterende edit-mode-flow.

---

#### 3. Rediger ejendomsprofil
**Sværhedsgrad:** Let  
**Hvad det gør:** Opfylder krav 1.6 — brugeren skal kunne ændre en eksisterende ejendomsprofil (fx opdatere BBR-data eller navn).  
**Kom i gang:** Tilføj en "Rediger"-knap på ejendomsprofilkortet i propertyGrid eller på `ejendom.html` der åbner et lille modal/formular med de redigerbare felter. Backend har allerede `ejendomsprofilRoute.js` — tjek om der er en PUT-endpoint der, ellers tilføj den.  
**Strukturændring:** Nej — lille tilføjelse i `propertyGrid.js` og en evt. backend-rute.

---

#### 4. Afdragsfri periode på lån
**Sværhedsgrad:** Middel  
**Hvad det gør:** Dækker krav 3.2 — opgaven nævner specifikt afdragsfri periode som et låne-parameter.  
**Kom i gang:** Tilføj et `afdragsfriPeriode`-felt (antal måneder) i trin 4 for hvert lån. Opdater annuitetsformlen i `investeringscase.js` og `sammenlign.js` til at tage højde for perioden (rente-only i perioden, derefter annuitet over resterende løbetid). Kræver ny DB-kolonne i `Laan`-tabellen: `ALTER TABLE Laan ADD afdragsfriMaaneder INT NULL DEFAULT 0`.  
**Strukturændring:** Ja — ny DB-kolonne, opdatering af beregningslogik og formular.

---

#### 5. Graf/diagram på simuleringsresultater
**Sværhedsgrad:** Let (med bibliotek)  
**Hvad det gør:** Styrker visualiseringen — opgaven nævner grafer og diagrammer. En linjegraf over 30 år for egenkapital/cashflow/gæld er visuelt overbevisende.  
**Kom i gang:** Brug `Chart.js` (tilladt som eksternt bibliotek — tilføj i `<script src="https://cdn.jsdelivr.net/npm/chart.js">` og kreditér i koden). Lav et `<canvas>`-element under 30-årstabellen. Feed dataene fra `render30ÅrTabel()` ind i et `new Chart(...)` kald.  
**Strukturændring:** Nej — tilføjelse oven på eksisterende kode i `investeringscase.html` og `investeringscase.js`.

---

### ⚠️ Bør poleres — er delvist lavet men kan styrkes

---

#### 6. Adresse-valideringsfejlbesked
**Sværhedsgrad:** Let  
**Hvad det gør:** Opgaven kræver "validering med fejlhåndtering mod API" — nu er der ingen synlig fejlbesked hvis DAWA API'et er nede eller returnerer tomt.  
**Kom i gang:** I `bbrService.js`, i `.catch()`-blokken og ved `data.length === 0`, vis en tekst i et `<p>`-element under søgefeltet: "Ingen adresser fundet" eller "API-fejl — prøv igen".  
**Strukturændring:** Nej.

---

#### 7. Driftsomkostninger opdelt månedligt/årligt i simulering
**Sværhedsgrad:** Let  
**Hvad det gør:** Krav 3.4 siger systemet skal "sammenlægge driftsomkostninger på månedligt og årligt niveau". Det gemmes men vises kun som ét tal i oversigten.  
**Kom i gang:** I `renderSimulationTabel()`, tilføj to rækker: `Driftsomkostninger/md.` (driftsOmkostninger / 12) og `Driftsomkostninger/år`. `caseData` mangler feltet — `hentCase()` skal hente det fra backend, og backend-GET'en skal returnere `driftsOmkostninger`-beløbet separat fra `renoveringsomkostninger`.  
**Strukturændring:** Lille — backend GET-query og frontend `hentCase()` skal udvides.

---

#### 8. Kopiering af `hentCases()` i compare.js og sammenlign.js
**Sværhedsgrad:** Let  
**Hvad det gør:** Vedligeholdbarhedskrav — samme funktion er kopieret to steder. Giver dårligt eksempel ved mundtlig eksamen.  
**Kom i gang:** Flyt `hentCases()` og `beregnMetrikker()` til et fælles modul fx `cases.js` (filen eksisterer allerede!) og importer dem med `<script src="/js/cases.js">` i `compare.html` og `sammenlign.html`.  
**Strukturændring:** Nej — `cases.js` findes, den skal bare bruges.

---

#### 9. Grundareal-felt bruger forkert BBR-nøgle
**Sværhedsgrad:** Let  
**Hvad det gør:** `byg041BebyggetAreal` er bygningens bebyggede areal, ikke grundens areal. Opgaven kræver grundareal. Det korrekte felt er `registreretareal` fra `BBR_Jordstykke`.  
**Kom i gang:** Backend-routen for `/api/v1/properties/grund` henter allerede jordstykke-data. Tjek at `registreretareal` returneres og at `index.js` bruger det korrekte felt.  
**Strukturændring:** Nej — kun en feltnavnerettelse.

---

#### 10. README-fil — sikre fuldstændighed
**Sværhedsgrad:** Meget let  
**Hvad det gør:** Formelt krav — README skal vise hvordan systemet køres lokalt.  
**Kom i gang:** Tjek `README.md` og sikr at den beskriver: `npm install`, `.env`-opsætning, `node Backend/server.js` og hvilken port serveren kører på.  
**Strukturændring:** Nej.

---

## Sammenfatning

| Kategori | Lavet | Delvist | Mangler |
|----------|-------|---------|---------|
| Funktionelle krav | 22 | 7 | 4 |
| Ikke-funktionelle krav | 4 | 3 | 2 |
| Teknisk dokumentation | 0 | 0 | 6 |
| Video | 0 | 0 | 1 |

**Vigtigste at gøre FØR aflevering:** Unit tests (#1), duplikering af case (#2), graph/diagram (#5), og rapport-dokumentationen (D.1–D.6).
