# Backend-ændringer krævet for nye frontend-funktioner

Disse ændringer er nødvendige for at nye frontend-felter kan persisteres permanent i databasen.
Indtil de implementeres, gemmes låndata i browserens localStorage som midlertidig løsning.

---

## 1. Nyt felt i Laan-tabellen: afdragsFriMaaneder

```sql
ALTER TABLE Laan
ADD afdragsFriMaaneder INT NOT NULL DEFAULT 0;
```

Opdater POST `/api/v1/investment-cases` og PUT `/api/v1/investment-cases/:id`
til at modtage og gemme `afdragsFriMaaneder` for hvert lån.

Nye request body-felter:
```json
{
  "afdragsFriMaaneder":   0,
  "bankLaanAfdragsFri":   0,
  "andreLaanAfdragsFri":  0
}
```

Eksempel INSERT-ændring i Laan:
```sql
INSERT INTO Laan (investeringsCaseID, laaneBeloeb, rente, loebeTid, laaneType, afdragsFriMaaneder)
VALUES (@investeringsCaseID, @laaneBeloeb, @rente, @loebeTid, @laaneType, @afdragsFriMaaneder)
```

---

## 2. Nyt felt i KoebsOmkostninger: driftsOmkostninger

Driftsomkostninger gemmes aktuelt som en Renovation-post (workaround).
Tilføj en dedikeret kolonne:

```sql
ALTER TABLE KoebsOmkostninger
ADD driftsOmkostninger DECIMAL(10,2) NOT NULL DEFAULT 0;
```

Opdater INSERT og UPDATE i KoebsOmkostninger til at inkludere feltet.
Fjern den eksisterende Renovation-workaround for driftsomkostninger i begge routes.

---

## 3. GET-query mangler låndata

`GET /api/v1/users/:brugerID/investment-cases` returnerer ikke data fra Laan-tabellen.
Frontend-simulering og -visning kræver låndata for at fungere korrekt.

### Mulighed A: laanNummer-kolonne (anbefalet)

Tilføj et `laanNummer`-felt til Laan til at skelne realkreditlån (1), banklån (2) og andre lån (3):

```sql
ALTER TABLE Laan
ADD laanNummer INT NOT NULL DEFAULT 1;
```

Opdater POST/PUT routes til at sende laanNummer = 1, 2, 3 for de tre låntyper.

Tilføj til GET-query:

```sql
SELECT
  ...
  l1.laaneBeloeb        AS realkreditBeloeb,
  l1.laaneType          AS realkreditType,
  l1.rente              AS realkreditRente,
  l1.loebeTid           AS realkreditLoebetid,
  l1.afdragsFriMaaneder AS realkreditAfdragsFri,

  l2.laaneBeloeb        AS bankLaanBeloeb,
  l2.laaneType          AS bankLaanType,
  l2.rente              AS bankLaanRente,
  l2.loebeTid           AS bankLaanLoebetid,
  l2.afdragsFriMaaneder AS bankLaanAfdragsFri,

  l3.laaneBeloeb        AS andreLaanBeloeb,
  l3.laaneType          AS andreLaanType,
  l3.rente              AS andreLaanRente,
  l3.loebeTid           AS andreLaanLoebetid,
  l3.afdragsFriMaaneder AS andreLaanAfdragsFri,

  ko.driftsOmkostninger

FROM InvesteringsCase ic
...
LEFT JOIN Laan l1 ON ic.investeringsCaseID = l1.investeringsCaseID AND l1.laanNummer = 1
LEFT JOIN Laan l2 ON ic.investeringsCaseID = l2.investeringsCaseID AND l2.laanNummer = 2
LEFT JOIN Laan l3 ON ic.investeringsCaseID = l3.investeringsCaseID AND l3.laanNummer = 3
```

### Frontend-tilpasning efter backend er klar

Når backend returnerer låndata, fjern localStorage-supplementet i:
- `Frontend/js/investeringscase.js` → `hentCase()` → sletning af `hentLånDataFraStorage`-blokken
- `Frontend/js/sammenlign.js` → `hentCases()` → samme
- Brug i stedet de nye felter direkte fra `result.data`

---

## 4. Beregningsnoter (til reference)

Løbetid gemmes i **måneder** i databasen (loebeTid INT).
Frontend bruger måneder direkte i alle beregninger:
- Månedlig ydelse: `beløb * (rente/12) / (1 - (1 + rente/12)^-amortMdr)`
- Restgæld: annuitetsformel på amortiserende del (efter afdragsfri periode)

Rente gemmes i databasen som **procent** (fx 3.5 for 3,5%).
Frontend dividerer med 100 ved indlæsning og multiplicerer med 100 ved gemning.
