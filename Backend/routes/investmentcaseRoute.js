const express = require("express");
const router = express.Router();
const db = require("../services/db");
const sql = db.sql;

router.post("/investment-cases", async (req, res) => {
  const transaction = new sql.Transaction(db.pool);

  try {
    const {
      ejendomsProfilID,
      caseNavn,
      beskrivelse,
      simuleringsAar,

      koebsPris,
      egenKapital,
      otherCosts,
      renovationOmkostninger,

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
      udlejningUdgifter
    } = req.body;

    if (!ejendomsProfilID || !caseNavn || !simuleringsAar) {
      return res.status(400).json({
        success: false,
        message: "Mangler nødvendige felter."
      });
    }

    await db.poolConnect;
    await transaction.begin();

    const caseRequest = new sql.Request(transaction);

    const caseResult = await caseRequest
      .input("ejendomsProfilID", sql.Int, Number(ejendomsProfilID))
      .input("caseNavn", sql.VarChar(50), caseNavn)
      .input("beskrivelse", sql.VarChar(255), beskrivelse || null)
      .input("simuleringsAar", sql.Int, Number(simuleringsAar))
      .query(`
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
      .input("omkostningsType", sql.VarChar(255), "koebsPris")
      .input("pris", sql.Decimal(10, 2), Number(koebsPris))
      .input("noter", sql.VarChar(255), "Købspris")
      .query(`
        INSERT INTO KoebsOmkostninger (
          investeringsCaseID,
          omkostningsType,
          pris,
          noter
        )
        VALUES (
          @investeringsCaseID,
          @omkostningsType,
          @pris,
          @noter
        )
      `);

    await new sql.Request(transaction)
      .input("investeringsCaseID", sql.Int, investeringsCaseID)
      .input("omkostningsType", sql.VarChar(255), "egenKapital")
      .input("pris", sql.Decimal(10, 2), Number(egenKapital))
      .input("noter", sql.VarChar(255), "Egenkapital")
      .query(`
        INSERT INTO KoebsOmkostninger (
          investeringsCaseID,
          omkostningsType,
          pris,
          noter
        )
        VALUES (
          @investeringsCaseID,
          @omkostningsType,
          @pris,
          @noter
        )
      `);

    await new sql.Request(transaction)
      .input("investeringsCaseID", sql.Int, investeringsCaseID)
      .input("omkostningsType", sql.VarChar(255), "otherCosts")
      .input("pris", sql.Decimal(10, 2), Number(otherCosts))
      .input("noter", sql.VarChar(255), "Andre omkostninger")
      .query(`
        INSERT INTO KoebsOmkostninger (
          investeringsCaseID,
          omkostningsType,
          pris,
          noter
        )
        VALUES (
          @investeringsCaseID,
          @omkostningsType,
          @pris,
          @noter
        )
      `);

    // Gem renovation hvis relevant
    if (Number(renovationOmkostninger) > 0) {
      await new sql.Request(transaction)
        .input("investeringsCaseID", sql.Int, investeringsCaseID)
        .input("navn", sql.VarChar(255), "Standard renovation")
        .input("beskrivelse", sql.VarChar(255), "Oprettet fra formular")
        .input("planlagtStartDato", sql.Date, null)
        .input("omkostninger", sql.Decimal(10, 2), Number(renovationOmkostninger))
        .input("forventetVaerdiStigning", sql.Decimal(10, 2), 0)
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
        term: loebetid
      },
      {
        amount: bankLaan,
        type: bankLaanType,
        interest: bankLaanRente,
        term: bankLaanLoebetid
      },
      {
        amount: andreLaan,
        type: andreLaanType,
        interest: andreLaanRente,
        term: andreLaanLoebetid
      }
    ];

    for (const loan of loans) {
      if (Number(loan.amount) > 0) {
        await new sql.Request(transaction)
          .input("investeringsCaseID", sql.Int, investeringsCaseID)
          .input("laaneBeloeb", sql.Decimal(10, 2), Number(loan.amount))
          .input("rente", sql.Decimal(5, 2), Number(loan.interest))
          .input("loebeTid", sql.Int, Number(loan.term))
          .input("laaneType", sql.VarChar(50), loan.type)
          .query(`
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
        erLejeBolig ? Number(udlejningIndkomst || 0) : 0
      )
      .input(
        "lejeUdgifter",
        sql.Decimal(10, 2),
        erLejeBolig ? Number(udlejningUdgifter || 0) : 0
      )
      .input("depositum", sql.Decimal(10, 2), 0)
      .query(`
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
        investeringsCaseID
      }
    });

  } catch (error) {
    console.error("Fejl ved oprettelse af investeringscase:", error);

    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Rollback fejl:", rollbackError);
    }

    return res.status(500).json({
      success: false,
      message: "Der opstod en fejl ved oprettelse af investeringscase"
    });
  }
});

module.exports = router;