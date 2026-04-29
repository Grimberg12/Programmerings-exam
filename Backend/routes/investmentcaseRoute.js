const express = require("express");
const router = express.Router();
const { db, sql } = require("../services/db");

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

      bankLaan,
      bankLaanType,
      bankLaanRente,
      bankLaanLoebetid,

      andreLaan,
      andreLaanType,
      andreLaanRente,
      andreLaanLoebetid,

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
        .input("navn", sql.VarChar(255), "Driftsomkostninger")
        .input("beskrivelse", sql.VarChar(255), "Samlede driftsomkostninger")
        .input("planlagtStartDato", sql.Date, null)
        .input("omkostninger", sql.Decimal(10, 2), Number(driftsOmkostninger))
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

    // Gem lån
    const loans = [
      {
        amount: laaneBeloeb,
        type: laaneType,
        interest: rente,
        term: loebetid,
      },
      {
        amount: bankLaan,
        type: bankLaanType,
        interest: bankLaanRente,
        term: bankLaanLoebetid,
      },
      {
        amount: andreLaan,
        type: andreLaanType,
        interest: andreLaanRente,
        term: andreLaanLoebetid,
      },
    ];

    for (const loan of loans) {
      if (Number(loan.amount) > 0) {
        await new sql.Request(transaction)
          .input("investeringsCaseID", sql.Int, investeringsCaseID)
          .input("laaneBeloeb", sql.Decimal(10, 2), Number(loan.amount))
          .input("rente", sql.Decimal(5, 2), Number(loan.interest))
          .input("loebeTid", sql.Int, Number(loan.term))
          .input("laaneType", sql.VarChar(50), loan.type).query(`
            INSERT INTO Laan (
              investeringsCaseID,
              laaneBeloeb,
              rente,
              loebeTid,
              laaneType
            )
            VALUES (
              @investeringsCaseID,
              @laaneBeloeb,
              @rente,
              @loebeTid,
              @laaneType
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
      .input("depositum", sql.Decimal(10, 2), 0).query(`
        INSERT INTO Udlejning (
          investeringsCaseID,
          erLejeBolig,
          lejeIndkomst,
          lejeUdgifter,
          depositum
        )
        VALUES (
          @investeringsCaseID,
          @erLejeBolig,
          @lejeIndkomst,
          @lejeUdgifter,
          @depositum
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

// Hent alle investeringscases for en given bruger, inkl. ejendomsprofil og adresse
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

// Slet investeringscase og alle tilknyttede data, ved tryk på slet-knap
router.delete("/investment-cases/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await db.connect();

    await pool.request().input("investeringsCaseID", sql.Int, Number(id))
      .query(`
        DELETE FROM Udlejning WHERE investeringsCaseID = @investeringsCaseID;
        DELETE FROM Laan WHERE investeringsCaseID = @investeringsCaseID;
        DELETE FROM Renovation WHERE investeringsCaseID = @investeringsCaseID;
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

      bankLaan,
      bankLaanType,
      bankLaanRente,
      bankLaanLoebetid,

      andreLaan,
      andreLaanType,
      andreLaanRente,
      andreLaanLoebetid,

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
        DELETE FROM Laan WHERE investeringsCaseID = @id;
        DELETE FROM Udlejning WHERE investeringsCaseID = @id;
      `);
    
    if (Number(driftsOmkostninger) > 0) {
      await new sql.Request(transaction)
        .input("id", sql.Int, Number(id))
        .input("navn", sql.VarChar(255), "Driftsomkostninger")
        .input("beskrivelse", sql.VarChar(255), "Samlede driftsomkostninger")
        .input("planlagtStartDato", sql.Date, null)
        .input("omkostninger", sql.Decimal(10, 2), Number(driftsOmkostninger))
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
        @id,
        @navn,
        @beskrivelse,
        @planlagtStartDato,
        @omkostninger,
        @forventetVaerdiStigning
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
      { amount: laaneBeloeb, type: laaneType, interest: rente, term: loebetid },
      {
        amount: bankLaan,
        type: bankLaanType,
        interest: bankLaanRente,
        term: bankLaanLoebetid,
      },
      {
        amount: andreLaan,
        type: andreLaanType,
        interest: andreLaanRente,
        term: andreLaanLoebetid,
      },
    ];

    for (const loan of loans) {
      if (Number(loan.amount) > 0) {
        await new sql.Request(transaction)
          .input("id", sql.Int, Number(id))
          .input("laaneBeloeb", sql.Decimal(10, 2), Number(loan.amount))
          .input("rente", sql.Decimal(5, 2), Number(loan.interest))
          .input("loebeTid", sql.Int, Number(loan.term))
          .input("laaneType", sql.VarChar(50), loan.type).query(`
            INSERT INTO Laan (
              investeringsCaseID, laaneBeloeb, rente, loebeTid, laaneType
            )
            VALUES (
              @id, @laaneBeloeb, @rente, @loebeTid, @laaneType
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
      .input("depositum", sql.Decimal(10, 2), 0).query(`
        INSERT INTO Udlejning (
          investeringsCaseID, erLejeBolig, lejeIndkomst, lejeUdgifter, depositum
        )
        VALUES (
          @id, @erLejeBolig, @lejeIndkomst, @lejeUdgifter, @depositum
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

module.exports = router;
