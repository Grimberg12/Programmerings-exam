# Eksamensoverblik — Ejendomsinvesterings-app
> Sidst opdateret: 2026-05-03

---

## 1. Hvad skete der med grundareal-fejlen — commit-historik

### Problemet kort
Grundarealfeltet viste samme tal som boligarealet. Det skyldes to uafhængige fejl der opstod i to forskellige commits.

---

### `ffe0f1b` — "BBR API" *(første implementation)*
BBR-backenden blev bygget fra bunden. `datafordelerservice.js` fik en funktion `hentJordstykke` der hentede grundareal fra **Datafordelerens Matriklen API** (`/Matriklen/MatrikelPublic/1/rest/Jordstykke`). Jordstykke-ID'et kom fra `grundData[0].jordstykkeList[0]`. Tilgangen var teknisk korrekt i princippet, men afhang af Datafordeler-auth til to API'er i forlængelse af hinanden.

---

### `fa2b17f` — "bbr fix" *(introduktionen af den grundlæggende fejl)*
Her forsøgte man at forenkle kæden. I stedet for `jordstykkeList` prøvede man nu:
```js
grundData?.[0]?.bestemtFastEjendom?.bfeNummer
```
**Fejlen:** `bestemtFastEjendom` i BBR REST API'et er en UUID-streng — ikke et objekt. Så `.bfeNummer` er altid `undefined`. Endpointet returnerede herefter altid 404, og `grundArealM2` blev aldrig hentet og blev altid gemt som `null` i databasen. Ingen opdagede det fordi `null` bare vises som `–` på siden.

---

### `2c086e3` — "Rollback" *(introduktionen af den synlige fejl)*
`index.js` blev genskabt. I den nye version brugte man `byg041BebyggetAreal` som grundareal:
```js
// Grundareal: bruger byg041BebyggetAreal (bebygget areal) fra BBR bygning
const grundareal = bygning.byg041BebyggetAreal ?? "–";
```
`byg041BebyggetAreal` er bygningens **fodaftryk** på grunden (hvor mange m² selve bygningskroppen dækker). For et typisk 1-plans hus er bygningens fodaftryk det samme tal som boligarealet — de to felter viste identiske værdier. Det er herfra fejlen blev synlig.

---

### `73798a7` + `62636d4` + `525f673` *(videre udvikling)*
`bbrService.js` fik de tre parallelle API-kald (enhed, bygning, grund). Men siden `/properties/grund` altid returnerede 404 pga. fejlen fra `fa2b17f`, blev `grundArealM2` konsekvent gemt som `null`.

---

### `96efd71` + `eb8ef33` *(database-visning + kort)*
`index.js` fik to kodestier — én der viser live BBR-data (med `adresseid` i URL), og én der viser gemt data fra databasen. Begge stier bar de ovenstående problemer med sig.

---

### Hvad der nu er rettet (2026-05-03)

| Fil | Rettelse |
|-----|---------|
| `Backend/routes/bbrRoutes.js` | `/properties/grund` omskrevet: i stedet for den brudte `bestemtFastEjendom.bfeNummer`-kæde via BBR, gå direkte via DAWA — adresse-ID → `matrikelnr` + `ejerlavskode` → jordstykker → `registreretareal` |
| `Frontend/js/index.js` | Grundareal bruger nu `jordstykke.registreretareal` (faktisk grundstykkes areal). Tilføjet grunt-kald til Promise.all. Boligareal bruger `enh027EnhedensBoligareal` med fallback til `enh026` |
| `Frontend/js/bbrService.js` | Boligareal bruger nu `enh027EnhedensBoligareal` med fallback — det rigtige felt gemmes i databasen ved oprettelse |

**Testresultat:** Gl Kongevej 15, Vejle → `registreretareal: 386 m²` returneres korrekt fra DAWA jordstykker.

---

## 2. Tjekliste ud fra opgaven

Legende: ✅ Lavet · ⚠️ Delvist · ❌ Mangler

### Forside og adressesøgning
| # | Krav | Status | Note |
|---|------|--------|------|
| 1.1 | Søg via dansk adresse | ✅ | `bbrService.js` + DAWA |
| 1.2 | Validering med fejlhåndtering | ⚠️ | Dropdown viser kun gyldige DAWA-adresser — ingen eksplicit fejlbesked ved API-nedbrud |
| 1.3 | Vis data fra API | ✅ | BBR-data i preview: type, år, areal, værelser, grundareal |
| 1.4 | Opret ejendomsprofil fra søgeresultat | ✅ | "Opret"-knap i `bbrService.js` → `ejendomsprofilRoute.js` |
| 1.5 | Overblik over eksisterende ejendomsprofiler | ✅ | `propertyGrid.js` + backend GET |
| 1.6 | Rediger ejendomsprofil | ❌ | Ingen PUT-endpoint eller frontend-knap til at ændre BBR-data på en profil |
| 1.7 | Slet ejendomsprofil | ✅ | Knap i `propertyGrid.js`, cascade-delete i backend |

### Ejendomsprofiler
| # | Krav | Status | Note |
|---|------|--------|------|
| 2.1 | Adressedata | ✅ | Vises på `ejendom.html` |
| 2.2 | Ejendomstype fra BBR | ✅ | `byg021BygningensAnvendelse` → dansk tekst |
| 2.3 | Byggeår fra BBR | ✅ | `byg026*`-felt |
| 2.4 | Boligareal fra BBR | ✅ | **Rettet:** `enh027EnhedensBoligareal` |
| 2.5 | Antal værelser fra BBR | ✅ | `enh031AntalVærelser` |
| 2.6 | Grundareal fra BBR | ✅ | **Rettet:** `registreretareal` fra DAWA jordstykker |
| 2.7 | Kortvisning — luftfoto | ✅ | WMS via backend proxy |
| 2.8 | Kortvisning — matrikelkort | ✅ | WMS via backend proxy |
| 2.9 | Opret investeringscase fra profil | ✅ | Wizard åbnes med knap |

### Investeringscases
| # | Krav | Status | Note |
|---|------|--------|------|
| 3.1 | Ejendomspris, advokat, tinglysning, rådgivning | ✅ | Trin 2 → `KoebsOmkostninger` |
| 3.2 | Lånebeløb, rente, løbetid, type | ✅ | Op til 3 lån → `Laan`-tabel |
| 3.2 | Afdragsfri periode | ⚠️ | Felt og DB-kolonne eksisterer, men bruges ikke i beregningerne |
| 3.3 | Renovering med tidspunkt | ✅ | Trin 3, dynamisk tilføjelse → `Renovation` |
| 3.4 | Løbende driftsomkostninger | ✅ | Felt i trin 2, gemmes og summeres |
| 3.4 | Opdelt månedligt/årligt | ⚠️ | Vises ikke opdelt — kun ét samlet tal |
| 3.5 | Udlejning til/fravalg med ind- og udgifter | ✅ | Trin 5 → `Udlejning` |
| 3.x | Rediger og gem case | ✅ | Edit-mode via `localStorage` + PUT-endpoint |

### Simulering og visualisering
| # | Krav | Status | Note |
|---|------|--------|------|
| 4.1 | Simulering over 30 år | ✅ | `render30ÅrTabel()` i `investeringscase.js` |
| 4.2 | Egenkapital, cashflow, gæld over tid | ✅ | Tre kolonner i 30-årstabellen |
| 4.3 | Visualisering | ⚠️ | Kun tabel — ingen graf. Opgaven siger "grafer og/eller tabeller" |

### Scenarier og sammenligning
| # | Krav | Status | Note |
|---|------|--------|------|
| 5.1 | Sammenlign cases på tværs af profiler | ✅ | `sammenlign.js`, op til 3 cases |
| 5.2 | Meningsfuld sammenligning | ✅ | Cashflow, egenkapital, gældsgrad — bedste fremhæves |
| 5.3 | 30-årig sammenligning | ✅ | `render30ÅrSammenligning()` |
| 5.4 | Duplikér case | ❌ | Ingen "kopiér case"-funktionalitet |

### Ikke-funktionelle krav
| # | Krav | Status | Note |
|---|------|--------|------|
| 6.1 | Konsistent navngivning | ⚠️ | Generelt dansk/camelCase — `investeringscase.js` blander lidt |
| 6.2 | Undgå duplikering | ⚠️ | `hentCases()` er kopieret identisk i `compare.js` og `sammenlign.js` |
| 6.3 | Fejlhåndtering | ✅ | Global `errorHandler.js`, try/catch overalt, 404-handler |
| 6.4 | Klasser med metoder | ✅ | `InvesteringWizard`-klassen med private felter |
| 7.1–7.2 | Unit tests (3 stk.) | ❌ | Ingen tests overhovedet |
| 8.1 | Brugervenligt interface | ✅ | Wizard, tooltips, validering, feedback |
| 8.2 | Gennemgående UI | ✅ | `color.css` med variabler, fælles header/footer |

---

## 3. Arkitektur — hvordan det er sat op

### Tre-lags arkitektur
```
Browser (HTML/CSS/JS)
     ↕ HTTP/JSON
Express Backend (Node.js)
     ↕ SQL over TCP
Azure SQL Server
     ↕ HTTPS
Externe API'er: DAWA, Datafordeler BBR, Dataforsyningen WMS
```

### Frontend (`Frontend/`)
Vanilla HTML/CSS/JavaScript — ingen frameworks. Siderne er statiske HTML-filer der serveres af Express fra `public/`-mappen.

| Fil | Ansvar |
|-----|--------|
| `bbrService.js` | Adressesøgning (DAWA), BBR-preview, opret ejendomsprofil |
| `index.js` | Viser ejendomsdetaljer på `ejendom.html` (to kodestier: live BBR eller fra DB) |
| `ejendom.js` | Investeringscase-formular: opret, rediger, submit |
| `ejendom-wizard.js` | `InvesteringWizard`-klassen — styrer trin, validering, navigation |
| `investeringscase.js` | Finansielle beregninger og visning (7 nøgletal + 30-årstabel) |
| `sammenlign.js` | Sammenligning af op til 3 cases |
| `propertyGrid.js` | Viser ejendomsoversigt med slet-knap |
| `cases.js` | Fælles hent-cases-logik (bruges på `cases.html`) |
| `getlayout.js` | Indsætter header og footer dynamisk |

### Backend (`Backend/`)
Express-app med route → service → database arkitektur. Autentificering er session-baseret via localStorage (simpel).

| Fil | Ansvar |
|-----|--------|
| `server.js` | App-opstart, middleware, statiske filer |
| `routes/api.js` | Hoved-router — samler alle sub-routes |
| `routes/bbrRoutes.js` | BBR/DAWA endpoints (enheder, bygning, grund, luftfoto, matrikelkort) |
| `routes/ejendomsprofilRoute.js` | CRUD på ejendomsprofiler |
| `routes/investmentcaseRoute.js` | Opret/rediger investeringscase (SQL-transaktion over 6 tabeller) |
| `routes/loginRoutes.js` + `userRoutes.js` | Login og registrering |
| `services/datafordelerservice.js` | HTTP-kald mod Datafordeler BBR REST API |
| `services/luftfotoService.js` | Bygger WMS-URL til luftfoto via DAWA + Dataforsyningen |
| `services/matrikelkortService.js` | Bygger WMS-URL til matrikelkort |
| `services/db.js` | SQL Server connection pool (lazy init) |

### Database (Azure SQL Server)
Normaliseret relationel model med fremmednøgler. En investeringscase er opdelt i separate tabeller efter ansvar:

```
Bruger
 └── EjendomsProfil → Adresse
      └── InvesteringsCase
           ├── KoebsOmkostninger   (pris, advokat, tinglysning...)
           ├── Laan                (op til 3 lån per case)
           ├── Renovation          (inkl. driftsomkostninger)
           └── Udlejning           (månedlig leje, udgifter)
```
`Simulation` og `SimulationsResultat` er i skemaet men bruges ikke i koden — beregningerne sker i JavaScript på klienten.

### Data-flow: Opret ejendomsprofil
```
Bruger søger → DAWA API (adressesøgning)
→ Vælger adresse → backend henter BBR-data parallelt:
    - /properties/enheder (boligareal, værelser)
    - /properties/bygning (type, byggeår)
    - /properties/grund  (grundareal via DAWA jordstykker)
    - /properties/luftfoto + /properties/matrikelkort
→ Preview vises → Bruger klikker "Opret"
→ POST /api/v1/ejendomsProfil → gemmes i DB
→ Redirect til ejendom.html
```

### Data-flow: Investeringscase-beregninger
Beregningerne ligger **udelukkende i frontend** (`investeringscase.js`). Backend returnerer rå tal, JavaScript beregner:
- Annuitetsformel for månedlig ydelse og restgæld
- Cashflow pr. år (lejeindtægt − drift − ydelse)
- Egenkapital (Kostpris − Restgæld + Prisudvikling)
- 30-årig projektion ved at itere over hvert år

---

## 4. Hvad vi kan gøre herfra — prioriteret

### Kritisk (direkte krav der ikke er dækket)

**Unit tests — 3 stk.** *(krav 7.2)*
Ingen tests overhovedet. Gode kandidater er annuitetsformlen, cashflow-beregning og egenkapitalforrentning. Nemmeste vej: kopier beregningsfunktionerne til `Backend/tests/beregninger.test.js` og brug `node:assert` (ingen installationer). Alternativt `jest`.

**Duplikér investeringscase** *(krav 5.4)*
Kopiér-knap på `investeringscase.html` der sætter data i `localStorage` som `editCase` (eksisterende edit-flow) og redirecter til `ejendom.html`. POST opretter ny case. Eneste forskel fra redigering: ID sendes ikke med, og caseNavn får " (kopi)" tilføjet. Ingen strukturændring nødvendig.

**Rediger ejendomsprofil** *(krav 1.6)*
En "Rediger"-knap på profilkortet eller på `ejendom.html`. Backend mangler et PUT-endpoint i `ejendomsprofilRoute.js`. Lille tilføjelse.

### Bør poleres

**Graf på simuleringen** *(krav 4.3)*
Opgaven siger "grafer og/eller tabeller". Tabellen er teknisk nok, men en linjegraf over 30 år for egenkapital/cashflow er visuelt overbevisende. Chart.js tilføjes med ét `<script>`-tag og et `<canvas>`-element — data feeds allerede fra `render30ÅrTabel()`.

**Afdragsfri periode bruges ikke i beregningerne** *(krav 3.2)*
Feltet og DB-kolonnen eksisterer allerede. Beregningerne i `investeringscase.js` skal opdateres: rente-only i afdragsfri perioden, derefter annuitet over resterende løbetid.

**Fejlbesked ved adressesøgning** *(krav 1.2)*
Ingen synlig tekst hvis DAWA er nede eller returnerer tomt. En linje i `.catch()`-blokken i `bbrService.js`.

**Duplikering af `hentCases()`** *(krav 6.2)*
Identisk funktion i `compare.js` og `sammenlign.js`. Flyt til `cases.js` (filen eksisterer allerede) og inkluder med `<script>` i begge HTML-filer.

---

## 5. Overvejelser og indvendinger — hvad I skal kunne svare på

### "Hvorfor er beregningerne i frontend og ikke backend?"
Beregningerne sker i JavaScript i browseren, ikke på serveren. Argumentet for: hurtigere feedback (ingen round-trip), og for simuleringer der kører 30 iterationer er det acceptabelt. Argumentet imod: logikken kan ikke let testes server-side, og ved evt. mobilapp ville den skulle skrives om. Til eksamen: anerkend afvejningen — for dette projekts scope er frontend-beregning forsvarlig, men i produktion ville en `simulationService.js` på backend give bedre testbarhed.

### "Hvorfor er databasemodellen normaliseret i stedet for én flad case-tabel?"
Fordi de fire underelementer (KoebsOmkostninger, Laan, Renovation, Udlejning) har forskellig kardinalitet: der kan fx være op til 3 lån og et variabelt antal renoveringer per case. En flad tabel ville kræve NULL-kolonner eller gentagne rækker — begge dele bryder normalformerne. Den nuværende model tillader desuden at tilføje fx et 4. lån uden skemaændring.

### "Hvad er `Simulation` og `SimulationsResultat`-tabellerne brugt til?"
De er i skemaet men ikke brugt i koden — beregningerne sker i JavaScript. Det er en åben svaghed man skal anerkende: tabellerne er tænkt til at gemme simuleringsresultater persistens, men det er ikke implementeret. En ærlig svar er bedre end at forsøge at forklare det væk.

### "Hvorfor ingen password-hashing?"
Passwords gemmes i plaintext. Det er et bevidst valg for at holde projektet enkelt til eksamen, men det er et sikkerhedsproblem i produktion. Nævn at `bcrypt` ville være det rigtige valg.

### "Hvad er forskellen på `adresseid` og `adgangsadresse.id` i DAWA?"
En `adresse` (med etage/dør) har sit eget UUID. En `adgangsadresse` (selve husnummeret) har et andet UUID. BBR's `AdresseIdentificerer` parameter accepterer begge. Koden bruger konsekvent den fulde adresse-ID fra DAWA's søgeresultat (`address.id`).

### "Hvorfor en backend-proxy til kortdata i stedet for direkte kald fra browseren?"
CORS. Dataforsyningens WMS-endpoints tillader ikke direkte kald fra browser-script. Backend henter koordinater fra DAWA, bygger WMS-URL og returnerer den til frontend. Desuden centraliserer det API-nøglehåndtering (nøglerne er i `.env`, ikke eksponeret i frontend-koden).

### "Hvad er `byg041BebyggetAreal` og hvorfor var det forkert?"
Det er arealet af bygningens fodaftryk på grunden — altså de m² selve bygningskroppen fysisk dækker. Det er ikke det samme som grundstykkets størrelse. For et 1-plans hus er de to tal tilfældigvis ens, hvilket er grunden til at fejlen ikke blev opdaget. Det rigtige grundareal er `registreretareal` fra DAWA jordstykker.

---

## 6. Metoder og mønstre vi har brugt

| Metode/mønster | Hvor |
|---------------|------|
| **3-lags arkitektur** | Frontend ↔ Express API ↔ SQL Server |
| **RESTful API** | GET/POST/PUT/DELETE på ressourcer (`/ejendomsProfil`, `/investment-cases/:id`) |
| **SQL-transaktion** | `investmentcaseRoute.js` — opret/opdater case i én atomisk operation over 6 tabeller |
| **Middleware** | `errorHandler.js` (global fejlhåndtering), `notFound.js` (404) |
| **Klasse med private felter** | `InvesteringWizard` i `ejendom-wizard.js` — opfylder OOP-krav |
| **Promise.all (parallelle kald)** | BBR-data hentes parallelt (enhed + bygning + grund + kort) |
| **Annuitetsformel** | `investeringscase.js` — månedlig ydelse og restgæld over tid |
| **Lazy initialization** | `db.js` — SQL-pool oprettes kun ved første kald |
| **Backend-proxy pattern** | Kortdata: backend henter og videreformidler WMS-URLs |
| **localStorage som session** | Brugerdata og edit-mode gemmes i localStorage |
| **Normaliseret datamodel** | Separate tabeller for lån, renovering, udlejning m.fl. |
| **Conditional fields** | Wizard viser/skjuler felter baseret på valg (fx lån, udlejning) |

---

## 7. Hvad vi kan fjerne eller slette

| Hvad | Fil | Hvorfor |
|------|-----|---------|
| `hentGrundFraId` og `hentJordstykkeViaDawa` i `datafordelerservice.js` | `Backend/services/datafordelerservice.js` | Bruges ikke længere — `/properties/grund` bruger nu direkte `fetch()` mod DAWA. Kan fjernes for at rydde op |
| `hentEjendomsrelationFraAdresseId` i `datafordelerservice.js` | Samme fil | Importeres ikke og bruges ingensteds i koden |
| `INDEX_BYGNINGSANVENDELSE`-objekt i `index.js` | `Frontend/js/index.js` linje 19–27 | Kommentaren over det siger "SKAL DET HER FJERNES HELT?????" — korrekt. Det bruges kun i én kodestig og kunne bare importeres/kopieres fra `bbrService.js` |
| `saveAddressToDatabase()` i `bbrService.js` | `Frontend/js/bbrService.js` linje 188–213 | Kalder `/api/v1/address/register` der ikke eksisterer — funktionen kaldes ikke. Død kode |
| `compare.js` | `Frontend/js/compare.js` | Ser ud til at være et forældet stadie af `sammenlign.js` — tjek om den bruges af nogen HTML-fil |
| `Simulation` og `SimulationsResultat`-tabeller | Databaseskema | Er aldrig skrevet til fra koden. Kan enten bruges (gem simuleringsresultater) eller fjernes fra skemaet og noteres i rapporten |
| Debug-`console.log`-linjer | `bbrService.js` linje 118–119 | `console.log("valgtAdresse:", ...)` og `console.log("valgtBBRData:", ...)` er debug-output der ikke bør sidde i produktionskoden |

---

## 8. Til mundtlig eksamen — hvad I skal have styr på

### De spørgsmål der næsten garanteret kommer

1. **"Forklar dataflowet fra bruger søger en adresse til data vises på ejendomssiden."**
   Gå igennem: DAWA-søgning → dropdown → valg → tre parallelle backend-kald → BBR Datafordeler REST API → DAWA jordstykker → svar samles → preview. Nøgleord: CORS-proxy, parallelle kald med `Promise.all`, JSON-transformation.

2. **"Vis os en beregning og forklar annuitetsformlen."**
   Åbn `investeringscase.js`. Find `beregnRestgæld()` og `beregnMånedligYdelse()`. Forklar at `i = rente/12`, at annuitet fordeler afdrag og rente over løbetiden, og at restgæld falder eksponentielt. Hav et konkret taleksempel klar (fx 2M kr., 3%, 30 år).

3. **"Hvorfor har I brugt SQL-transaktion i investmentcaseRoute.js?"**
   Fordi en investeringscase består af data i 6 tabeller. Hvis noget fejler halvvejs, skal ingen af tabellerne have data. Transaktion sikrer atomicitet — enten gemmes alt, eller ingenting gemmes.

4. **"Hvad er normalformer, og er jeres database normaliseret?"**
   1NF: atomiske værdier, ingen gentagende grupper. 2NF: ingen partielle afhængigheder. 3NF: ingen transitive afhængigheder. Peg på fx at lån ikke er gemt som "laan1_beloeb, laan2_beloeb" men i en separat `Laan`-tabel med FK — det er netop for at undgå brud på 1NF.

5. **"Hvad mangler I, og hvad ville I gøre anderledes?"**
   Ærlig svar: unit tests, password-hashing med bcrypt, `Simulation`-tabeller i brug, afdragsfri periode i beregningerne. Hvad vi ville gøre anderledes: beregningslogik i en `simulationService.js` på backend for bedre testbarhed.

6. **"Hvad er forskellen på enh026 og enh027?"**
   `enh026EnhedensSamledeAreal` er enhedens samlede areal inkl. evt. erhvervsdel. `enh027EnhedensBoligareal` er specifikt boligarealet. For et rent beboelseshus er de ens, men for blandede ejendomme er de forskellige. Vi bruger nu `enh027` med fallback til `enh026`.

### Ting der kan overraske jer
- `Simulation`-tabellerne eksisterer i DB men er aldrig skrevet til — vær klar til at forklare det
- `compare.js` og `sammenlign.js` har duplikeret kode — vær klar til at anerkende det og forklare hvad løsningen er
- Passwords er plaintext — nævn det selv, vis at I ved det er forkert
- Beregningerne sker i frontend, ikke backend — hav et argument klar

---

## 9. Hvad vi har bygget — samlet overblik

En **fuldt fungerende prototype** på en ejendomsinvesterings-app med:

- Adressesøgning mod offentligt DAWA API med live dropdown
- Automatisk hentning af BBR-data (type, år, boligareal, grundareal, værelser) via Datafordeler REST API
- Luftfoto og matrikelkort via WMS (Dataforsyningen)
- Brugerregistrering og login med localStorage-session
- Oprettelse og sletning af ejendomsprofiler gemt i Azure SQL Server
- 5-trins guidet investeringscase-wizard med tooltips og validering
- Op til 3 lån per case, dynamisk renoverings-tilføjelse, udlejningssupport
- Redigering af eksisterende cases via edit-mode
- 7 finansielle nøgletal og 30-årig simulering med annuitetsformel
- Sammenligning af op til 3 cases på tværs af ejendomsprofiler
- Normaliseret databasemodel med SQL-transaktion ved gem
- Global fejlhåndtering og 404-middleware
- CSS-variabler med konsistent tema på alle sider
