// ── Importer moduler ──────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const { db, sql } = require("../services/db");

// ── POST /investment-cases ────────────────────────────────────────────────────
// Opretter case i én SQL-transaktion: InvesteringsCase → KoebsOmkostninger → Renovation → Laan → Udlejning.
// Op til 3 lån (realkredit, bank, andre) — kun dem med beløb > 0 indsættes.
router.post("/investment-cases", async (req, res) => {
  let transaction;

  try {
    const pool = await db.connect();
    transaction = new sql.Transaction(pool);

    const {
      ejendomsProfilID,
      caseNavn,
      beskrivelse,
      simuleringsAar,

      koebsPris,
      egenKapital,
      advokat,
      tinglysning,
      koeberRaadgivning,
      andreOmkostninger,
      renovations,
      
      driftsOmkostninger,

      laaneBeloeb,
      laaneType,
      rente,
      loebetid,
      afdragsFriPeriode,

      bankLaan,
      bankLaanType,
      bankLaanRente,
      bankLaanLoebetid,
      bankLaanAfdragsFriPeriode,

      andreLaan,
      andreLaanType,
      andreLaanRente,
      andreLaanLoebetid,
      andreLaanAfdragsFriPeriode,

      udlejning,
      udlejningIndkomst,
      udlejningUdgifter,
    } = req.body;

    if (!ejendomsProfilID || !caseNavn || !simuleringsAar) {
      return res.status(400).json({
        success: false,
        message: "Mangler nødvendige felter.",
      });
    }

    await transaction.begin();

    const caseRequest = new sql.Request(transaction);

    const caseResult = await caseRequest
      .input("ejendomsProfilID", sql.Int, Number(ejendomsProfilID))
      .input("caseNavn", sql.VarChar(50), caseNavn)
      .input("beskrivelse", sql.VarChar(255), beskrivelse || null)
      .input("simuleringsAar", sql.Int, Number(simuleringsAar)).query(`
        INSERT INTO InvesteringsCase (
          ejendomsProfilID,
          caseNavn,
          beskrivelse,
          simuleringsAar
        )
        OUTPUT INSERTED.investeringsCaseID
        VALUES (
          @ejendomsProfilID,
          @caseNavn,
          @beskrivelse,
          @simuleringsAar
        )
      `);

    const investeringsCaseID = caseResult.recordset[0].investeringsCaseID;

    // Gem købsomkostninger
    await new sql.Request(transaction)
      .input("investeringsCaseID", sql.Int, investeringsCaseID)
      .input("pris", sql.Decimal(10, 2), Number(koebsPris))
      .input("egenKapital", sql.Decimal(10, 2), Number(egenKapital))
      .input("advokat", sql.Decimal(10, 2), Number(advokat))
      .input("tinglysning", sql.Decimal(10, 2), Number(tinglysning))
      .input("koeberRaadgivning", sql.Decimal(10, 2), Number(koeberRaadgivning))
      .input("andreOmkostninger", sql.Decimal(10, 2), Number(andreOmkostninger))
      .input("noter", sql.VarChar(255), "Købspris").query(`
        INSERT INTO KoebsOmkostninger (
          investeringsCaseID,
          pris,
          egenKapital,
          advokat,
          tinglysning,
          koeberRaadgivning,
          andreOmkostninger,
          noter
        )
        VALUES (
          @investeringsCaseID,
          @pris,
          @egenKapital,
          @advokat,
          @tinglysning,
          @koeberRaadgivning,
          @andreOmkostninger,
          @noter
        )
      `);

    // Gem renovation hvis relevant
    if (Array.isArray(renovations)) {
      for (const renovation of renovations) {
        if (Number(renovation.pris) > 0) {
          await new sql.Request(transaction)
            .input("investeringsCaseID", sql.Int, investeringsCaseID)
            .input("navn", sql.VarChar(255), renovation.navn || "Renovering")
            .input(
              "beskrivelse",
              sql.VarChar(255),
              renovation.beskrivelse || null,
            )
            .input(
              "planlagtStartDato",
              sql.Date,
              renovation.planlagtStartDato || null,
            )
            .input("omkostninger", sql.Decimal(10, 2), Number(renovation.pris))
            .input("forventetVaerdiStigning", sql.Decimal(10, 2), 0).query(`
            INSERT INTO Renovation (
              investeringsCaseID,
              navn,
              beskrivelse,
              planlagtStartDato,
              omkostninger,
              forventetVaerdiStigning
            )
            VALUES (
              @investeringsCaseID,
              @navn,
              @beskrivelse,
              @planlagtStartDato,
              @omkostninger,
              @forventetVaerdiStigning
            )
          `);
        }
      }
    }

    if (Number(driftsOmkostninger) > 0) {
      await new sql.Request(transaction)
        .input("investeringsCaseID", sql.Int, investeringsCaseID)
        .input("beloeb", sql.Decimal(10, 2), driftsOmkostninger || 0)
        .query(`
          INSERT INTO DriftsOmkostninger (
            investeringsCaseID,
            beloeb
          )
          VALUES (
            @investeringsCaseID,
            @beloeb
          )
        `);
    }

    // Gem lån
    const loans = [
      {
        kategori: "Realkredit",
        amount: laaneBeloeb,
        type: laaneType,
        interest: rente,
        term: loebetid,
        afdragsFriPeriode: afdragsFriPeriode,
      },
      {
        kategori: "Bank",
        amount: bankLaan,
        type: bankLaanType,
        interest: bankLaanRente,
        term: bankLaanLoebetid,
        afdragsFriPeriode: bankLaanAfdragsFriPeriode,
      },
      {
        kategori: "Andre",
        amount: andreLaan,
        type: andreLaanType,
        interest: andreLaanRente,
        term: andreLaanLoebetid,
        afdragsFriPeriode: andreLaanAfdragsFriPeriode,
      },
    ];

    for (const loan of loans) {
      if (Number(loan.amount) > 0) {
        await new sql.Request(transaction)
          .input("investeringsCaseID", sql.Int, investeringsCaseID)
          .input("laaneBeloeb", sql.Decimal(10, 2), Number(loan.amount))
          .input("rente", sql.Decimal(5, 2), Number(loan.interest))
          .input("loebeTid", sql.Int, Number(loan.term))
          .input("laaneType", sql.VarChar(50), `${loan.kategori}:${loan.type || ""}`)
          .input("afdragsFriPeriode", sql.Int, Number(loan.afdragsFriPeriode))
          .query(`
            INSERT INTO Laan (
              investeringsCaseID,
              laaneBeloeb,
              rente,
              loebeTid,
              laaneType,
              afdragsFriPeriode
            )
            VALUES (
              @investeringsCaseID,
              @laaneBeloeb,
              @rente,
              @loebeTid,
              @laaneType,
              @afdragsFriPeriode
            )
          `);
      }
    }

    // Gem udlejning
    const erLejeBolig = udlejning === true || udlejning === "true";

    await new sql.Request(transaction)
      .input("investeringsCaseID", sql.Int, investeringsCaseID)
      .input("erLejeBolig", sql.Bit, erLejeBolig)
      .input(
        "lejeIndkomst",
        sql.Decimal(10, 2),
        erLejeBolig ? Number(udlejningIndkomst || 0) : 0,
      )
      .input(
        "lejeUdgifter",
        sql.Decimal(10, 2),
        erLejeBolig ? Number(udlejningUdgifter || 0) : 0,
      )
      .query(`
        INSERT INTO Udlejning (
          investeringsCaseID,
          erLejeBolig,
          lejeIndkomst,
          lejeUdgifter
        )
        VALUES (
          @investeringsCaseID,
          @erLejeBolig,
          @lejeIndkomst,
          @lejeUdgifter
        )
      `);

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Investeringscase oprettet",
      data: {
        investeringsCaseID,
      },
    });
  } catch (error) {
    console.error("Fejl ved oprettelse af investeringscase:", error);

    try {
      if (transaction) {
        await transaction.rollback();
      }
    } catch (rollbackError) {
      console.error("Rollback fejl:", rollbackError);
    }

    return res.status(500).json({
      success: false,
      message: "Der opstod en fejl ved oprettelse af investeringscase",
    });
  }
});

// ── GET /users/:brugerID/investment-cases ─────────────────────────────────────
// JOIN-query samler data fra 5 tabeller. Renoveringsomkostninger summeres via subquery.
router.get("/users/:brugerID/investment-cases", async (req, res) => {
  try {
    const { brugerID } = req.params;
    const pool = await db.connect();

    const result = await pool
      .request()
      .input("brugerID", sql.Int, Number(brugerID)).query(`
        SELECT 
          ic.investeringsCaseID AS id,
          ic.caseNavn AS navn,
          ic.beskrivelse,
          ic.simuleringsAar,
          ic.datoOprettet,
          ic.datoAendret,

          ep.ejendomsProfilID,
          a.vejNavn,
          a.vejNummer,
          a.postnummer,
          a.bynavn,

          ep.boligArealM2 AS areal,
          ep.antalVaerelser,

          ko.pris AS koebsPris,
          ko.egenKapital,
          ko.advokat,
          ko.tinglysning,
          ko.koeberRaadgivning,
          ko.andreOmkostninger,
          ISNULL(ren.renoveringsomkostninger, 0) AS renoveringsomkostninger,

          ISNULL(drift.driftsOmkostninger, 0) AS driftsOmkostninger,

          rk.laaneBeloeb AS realkreditBeloeb,
          rk.laaneType AS realkreditType,
          rk.rente AS realkreditRente,
          rk.loebeTid AS realkreditLoebetid,
          rk.afdragsFriPeriode AS realkreditAfdragsFriPeriode,

          bl.laaneBeloeb AS bankBeloeb,
          bl.laaneType AS bankType,
          bl.rente AS bankRente,
          bl.loebeTid AS bankLoebetid,
          bl.afdragsFriPeriode AS bankAfdragsFriPeriode,

          al.laaneBeloeb AS andreBeloeb,
          al.laaneType AS andreType,
          al.rente AS andreRente,
          al.loebeTid AS andreLoebetid,
          al.afdragsFriPeriode AS andreAfdragsFriPeriode,

          u.erLejeBolig,
          u.lejeIndkomst,
          u.lejeUdgifter

        FROM InvesteringsCase ic
        INNER JOIN EjendomsProfil ep ON ic.ejendomsProfilID = ep.ejendomsProfilID
        INNER JOIN Adresse a ON ep.adresseID = a.adresseID
        LEFT JOIN KoebsOmkostninger ko ON ic.investeringsCaseID = ko.investeringsCaseID
        LEFT JOIN Udlejning u ON ic.investeringsCaseID = u.investeringsCaseID

        LEFT JOIN (
        SELECT 
        investeringsCaseID,
        SUM(omkostninger) AS renoveringsomkostninger
        FROM Renovation
        GROUP BY investeringsCaseID
        ) ren ON ic.investeringsCaseID = ren.investeringsCaseID

        LEFT JOIN (
        SELECT 
        investeringsCaseID,
        SUM(beloeb) AS driftsOmkostninger
        FROM DriftsOmkostninger
        GROUP BY investeringsCaseID
        ) drift ON ic.investeringsCaseID = drift.investeringsCaseID

        LEFT JOIN (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY investeringsCaseID ORDER BY investeringsCaseID) AS rn
          FROM Laan
        ) rk ON ic.investeringsCaseID = rk.investeringsCaseID
          AND (rk.laaneType LIKE 'realkredit:%' OR (rk.laaneType NOT LIKE '%:%' AND rk.rn = 1))

        LEFT JOIN (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY investeringsCaseID ORDER BY investeringsCaseID) AS rn
          FROM Laan
        ) bl ON ic.investeringsCaseID = bl.investeringsCaseID
          AND (bl.laaneType LIKE 'bank:%' OR (bl.laaneType NOT LIKE '%:%' AND bl.rn = 2))

        LEFT JOIN (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY investeringsCaseID ORDER BY investeringsCaseID) AS rn
          FROM Laan
        ) al ON ic.investeringsCaseID = al.investeringsCaseID
          AND (al.laaneType LIKE 'andre:%' OR (al.laaneType NOT LIKE '%:%' AND al.rn = 3))
        WHERE ep.brugerID = @brugerID
        ORDER BY ic.datoOprettet DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Fejl ved hentning af investeringscases:", error);
    res
      .status(500)
      .json({ success: false, message: "Kunne ikke hente investeringscases." });
  }
});

// ── GET /ejendomsprofiler/:id/investment-cases ────────────────────────────────
router.get("/ejendomsprofiler/:id/investment-cases", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await db.connect();

    const result = await pool
      .request()
      .input("ejendomsProfilID", sql.Int, Number(id))
      .query(`
        SELECT 
          ic.investeringsCaseID AS id,
          ic.caseNavn AS navn,
          ic.beskrivelse,
          ic.simuleringsAar,
          ic.datoOprettet,
          ic.datoAendret,

          ko.pris AS koebsPris,
          ko.egenKapital,

          u.erLejeBolig,
          u.lejeIndkomst,
          u.lejeUdgifter
        FROM InvesteringsCase ic
        LEFT JOIN KoebsOmkostninger ko 
          ON ic.investeringsCaseID = ko.investeringsCaseID
        LEFT JOIN Udlejning u 
          ON ic.investeringsCaseID = u.investeringsCaseID
        WHERE ic.ejendomsProfilID = @ejendomsProfilID
        ORDER BY ic.datoOprettet DESC
      `);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error("Fejl ved hentning af relaterede investeringscases:", error);
    res.status(500).json({
      success: false,
      message: "Kunne ikke hente relaterede investeringscases."
    });
  }
});

// ── DELETE /investment-cases/:id ──────────────────────────────────────────────
router.delete("/investment-cases/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await db.connect();

    await pool.request().input("investeringsCaseID", sql.Int, Number(id))
      .query(`
        DELETE FROM Udlejning WHERE investeringsCaseID = @investeringsCaseID;
        DELETE FROM Laan WHERE investeringsCaseID = @investeringsCaseID;
        DELETE FROM Renovation WHERE investeringsCaseID = @investeringsCaseID;
        DELETE FROM DriftsOmkostninger WHERE investeringsCaseID = @investeringsCaseID;
        DELETE FROM KoebsOmkostninger WHERE investeringsCaseID = @investeringsCaseID;
        DELETE FROM InvesteringsCase WHERE investeringsCaseID = @investeringsCaseID;
      `);

    res.json({
      success: true,
      message: "Investeringscase slettet",
    });
  } catch (error) {
    console.error("Fejl ved sletning af investeringscase:", error);
    res.status(500).json({
      success: false,
      message: "Kunne ikke slette investeringscase.",
    });
  }
});

// ── PUT /investment-cases/:id ─────────────────────────────────────────────────
router.put("/investment-cases/:id", async (req, res) => {
  let transaction;

  try {
    const { id } = req.params;
    const pool = await db.connect();
    transaction = new sql.Transaction(pool);

    await transaction.begin();

    const {
      caseNavn,
      beskrivelse,
      simuleringsAar,

      koebsPris,
      egenKapital,
      advokat,
      tinglysning,
      koeberRaadgivning,
      andreOmkostninger,
      renovations,
      driftsOmkostninger,

      laaneBeloeb,
      laaneType,
      rente,
      loebetid,
      afdragsFriPeriode,

      bankLaan,
      bankLaanType,
      bankLaanRente,
      bankLaanLoebetid,
      bankLaanAfdragsFriPeriode,

      andreLaan,
      andreLaanType,
      andreLaanRente,
      andreLaanLoebetid,
      andreLaanAfdragsFriPeriode,

      udlejning,
      udlejningIndkomst,
      udlejningUdgifter,
    } = req.body;

    await new sql.Request(transaction)
      .input("id", sql.Int, Number(id))
      .input("caseNavn", sql.VarChar(50), caseNavn)
      .input("beskrivelse", sql.VarChar(255), beskrivelse || null)
      .input("simuleringsAar", sql.Int, Number(simuleringsAar || 30)).query(`
        UPDATE InvesteringsCase
        SET caseNavn = @caseNavn,
            beskrivelse = @beskrivelse,
            simuleringsAar = @simuleringsAar,
            datoAendret = GETDATE()
        WHERE investeringsCaseID = @id
      `);

    await new sql.Request(transaction).input("id", sql.Int, Number(id)).query(`
        DELETE FROM KoebsOmkostninger WHERE investeringsCaseID = @id;
        DELETE FROM Renovation WHERE investeringsCaseID = @id;
        DELETE FROM DriftsOmkostninger WHERE investeringsCaseID = @id;
        DELETE FROM Laan WHERE investeringsCaseID = @id;
        DELETE FROM Udlejning WHERE investeringsCaseID = @id;
      `);
    
    if (Number(driftsOmkostninger) > 0) {
      await new sql.Request(transaction)
        .input("id", sql.Int, Number(id))
        .input("beloeb", sql.Decimal(10, 2), Number(driftsOmkostninger))
        .query(`
          INSERT INTO DriftsOmkostninger (
            investeringsCaseID,
            beloeb
          )
          VALUES (
            @id,
            @beloeb
          )
        `);
    }

    await new sql.Request(transaction)
      .input("id", sql.Int, Number(id))
      .input("pris", sql.Decimal(10, 2), Number(koebsPris))
      .input("egenKapital", sql.Decimal(10, 2), Number(egenKapital))
      .input("advokat", sql.Decimal(10, 2), Number(advokat))
      .input("tinglysning", sql.Decimal(10, 2), Number(tinglysning))
      .input("koeberRaadgivning", sql.Decimal(10, 2), Number(koeberRaadgivning))
      .input("andreOmkostninger", sql.Decimal(10, 2), Number(andreOmkostninger))
      .input("noter", sql.VarChar(255), "Redigeret købspris").query(`
        INSERT INTO KoebsOmkostninger (
          investeringsCaseID, pris, egenKapital, advokat,
          tinglysning, koeberRaadgivning, andreOmkostninger, noter
        )
        VALUES (
          @id, @pris, @egenKapital, @advokat,
          @tinglysning, @koeberRaadgivning, @andreOmkostninger, @noter
        )
      `);

    if (Array.isArray(renovations)) {
      for (const renovation of renovations) {
        if (Number(renovation.pris) > 0) {
          await new sql.Request(transaction)
            .input("id", sql.Int, Number(id))
            .input("navn", sql.VarChar(255), renovation.navn || "Renovering")
            .input(
              "beskrivelse",
              sql.VarChar(255),
              renovation.beskrivelse || null,
            )
            .input(
              "planlagtStartDato",
              sql.Date,
              renovation.planlagtStartDato || null,
            )
            .input("omkostninger", sql.Decimal(10, 2), Number(renovation.pris))
            .query(`
              INSERT INTO Renovation (
                investeringsCaseID,
                navn,
                beskrivelse,
                planlagtStartDato,
                omkostninger,
                forventetVaerdiStigning
              )
              VALUES (
                @id,
                @navn,
                @beskrivelse,
                @planlagtStartDato,
                @omkostninger,
                0
              )
            `);
        }
      }
    }

    const loans = [
      { 
        kategori: "Realkredit",
        amount: laaneBeloeb, 
        type: laaneType, 
        interest: rente, 
        term: loebetid,
        afdragsFriPeriode: afdragsFriPeriode, 
      },
      {
        kategori: "Bank",
        amount: bankLaan,
        type: bankLaanType,
        interest: bankLaanRente,
        term: bankLaanLoebetid,
        afdragsFriPeriode: bankLaanAfdragsFriPeriode,
      },
      {
        kategori: "Andre",
        amount: andreLaan,
        type: andreLaanType,
        interest: andreLaanRente,
        term: andreLaanLoebetid,
        afdragsFriPeriode: andreLaanAfdragsFriPeriode,
      },
    ];

    for (const loan of loans) {
      if (Number(loan.amount) > 0) {
        await new sql.Request(transaction)
          .input("id", sql.Int, Number(id))
          .input("laaneBeloeb", sql.Decimal(10, 2), Number(loan.amount))
          .input("rente", sql.Decimal(5, 2), Number(loan.interest))
          .input("loebeTid", sql.Int, Number(loan.term))
          .input("laaneType", sql.VarChar(50), `${loan.kategori}:${loan.type || ""}`)
          .input("afdragsFriPeriode", sql.Int, Number(loan.afdragsFriPeriode || 0))
          .query(`
            INSERT INTO Laan (
              investeringsCaseID, laaneBeloeb, rente, loebeTid, laaneType, afdragsFriPeriode
            )
            VALUES (
              @id, @laaneBeloeb, @rente, @loebeTid, @laaneType, @afdragsFriPeriode
            )
          `);
      }
    }

    const erLejeBolig = udlejning === true || udlejning === "true";

    await new sql.Request(transaction)
      .input("id", sql.Int, Number(id))
      .input("erLejeBolig", sql.Bit, erLejeBolig)
      .input(
        "lejeIndkomst",
        sql.Decimal(10, 2),
        erLejeBolig ? Number(udlejningIndkomst || 0) : 0,
      )
      .input(
        "lejeUdgifter",
        sql.Decimal(10, 2),
        erLejeBolig ? Number(udlejningUdgifter || 0) : 0,
      )
      .query(`
        INSERT INTO Udlejning (
          investeringsCaseID, erLejeBolig, lejeIndkomst, lejeUdgifter 
        )
        VALUES (
          @id, @erLejeBolig, @lejeIndkomst, @lejeUdgifter
        )
      `);

    await transaction.commit();

    res.json({
      success: true,
      message: "Investeringscase opdateret",
    });
  } catch (error) {
    console.error("Fejl ved opdatering af investeringscase:", error);

    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({
      success: false,
      message: "Kunne ikke opdatere investeringscase.",
    });
  }
});

// ── POST /investment-cases/:id/duplicate ──────────────────────────────────────
// Kopierer hele casen med SQL SELECT INTO: InvesteringsCase, KoebsOmkostninger, Renovation, Laan, Udlejning.
router.post("/investment-cases/:id/duplicate", async (req, res) => {
  let transaction;

  try {
    const { id } = req.params;
    const pool = await db.connect();
    transaction = new sql.Transaction(pool);

    await transaction.begin();

    // Opretter ny investeringscase baseret på den gamle
    const caseResult = await new sql.Request(transaction)
      .input("id", sql.Int, Number(id))
      .query(`
        INSERT INTO InvesteringsCase (
          ejendomsProfilID,
          caseNavn,
          beskrivelse,
          simuleringsAar
        )
        OUTPUT INSERTED.investeringsCaseID
        SELECT
          ejendomsProfilID,
          LEFT('Kopi af ' + caseNavn, 50),
          beskrivelse,
          simuleringsAar
        FROM InvesteringsCase
        WHERE investeringsCaseID = @id;
      `);

    if (caseResult.recordset.length === 0) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Den valgte investeringscase blev ikke fundet.",
      });
    }

    const nyInvesteringsCaseID = caseResult.recordset[0].investeringsCaseID;

    // Kopier købsomkostninger
    await new sql.Request(transaction)
      .input("gammelId", sql.Int, Number(id))
      .input("nyId", sql.Int, nyInvesteringsCaseID)
      .query(`
        INSERT INTO KoebsOmkostninger (
          investeringsCaseID,
          pris,
          egenKapital,
          advokat,
          tinglysning,
          koeberRaadgivning,
          andreOmkostninger,
          noter
        )
        SELECT
          @nyId,
          pris,
          egenKapital,
          advokat,
          tinglysning,
          koeberRaadgivning,
          andreOmkostninger,
          'Kopieret fra tidligere case'
        FROM KoebsOmkostninger
        WHERE investeringsCaseID = @gammelId;
      `);

    // Kopier renoveringer
    await new sql.Request(transaction)
      .input("gammelId", sql.Int, Number(id))
      .input("nyId", sql.Int, nyInvesteringsCaseID)
      .query(`
        INSERT INTO Renovation (
          investeringsCaseID,
          navn,
          beskrivelse,
          planlagtStartDato,
          omkostninger,
          forventetVaerdiStigning
        )
        SELECT
          @nyId,
          navn,
          beskrivelse,
          planlagtStartDato,
          omkostninger,
          forventetVaerdiStigning
        FROM Renovation
        WHERE investeringsCaseID = @gammelId;
      `);

    await new sql.Request(transaction)
      .input("gammelId", sql.Int, Number(id))
      .input("nyId", sql.Int, nyInvesteringsCaseID)
      .query(`
        INSERT INTO DriftsOmkostninger (
          investeringsCaseID,
          beloeb
        )
        SELECT
          @nyId,
          beloeb
        FROM DriftsOmkostninger
        WHERE investeringsCaseID = @gammelId;
      `);

    // Kopier lån
    await new sql.Request(transaction)
      .input("gammelId", sql.Int, Number(id))
      .input("nyId", sql.Int, nyInvesteringsCaseID)
      .query(`
        INSERT INTO Laan (
          investeringsCaseID,
          laaneBeloeb,
          rente,
          loebeTid,
          laaneType,
          afdragsFriPeriode
        )
        SELECT
          @nyId,
          laaneBeloeb,
          rente,
          loebeTid,
          laaneType,
          afdragsFriPeriode
        FROM Laan
        WHERE investeringsCaseID = @gammelId;
      `);

    // Kopier udlejning
    await new sql.Request(transaction)
      .input("gammelId", sql.Int, Number(id))
      .input("nyId", sql.Int, nyInvesteringsCaseID)
      .query(`
        INSERT INTO Udlejning (
          investeringsCaseID,
          erLejeBolig,
          lejeIndkomst,
          lejeUdgifter
        )
        SELECT
          @nyId,
          erLejeBolig,
          lejeIndkomst,
          lejeUdgifter
        FROM Udlejning
        WHERE investeringsCaseID = @gammelId;
      `);

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Investeringscase duplikeret",
      data: {
        investeringsCaseID: nyInvesteringsCaseID,
      },
    });
  } catch (error) {
    console.error("Fejl ved duplikering af investeringscase:", error);

    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({
      success: false,
      message: "Kunne ikke duplikere investeringscase.",
    });
  }
});

module.exports = router;