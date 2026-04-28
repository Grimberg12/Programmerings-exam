const express = require("express");
const router = express.Router();
const { db, sql } = require("../services/db");

router.post("/ejendomsProfil", async (req, res) => {
  try {
    const {
      brugerID,
      vejNavn,
      vejNummer,
      etage,
      postnummer,
      bynavn,
      ejendomstype,
      byggeAar,
      boligArealM2,
      antalVaerelser,
      grundArealM2
    } = req.body;

    if (!brugerID || !vejNavn || !vejNummer || !postnummer || !bynavn) {
      return res.status(400).json({
        success: false,
        message: "Mangler nødvendige adressefelter"
      });
    }

    const pool = await db.connect();

    // 1. Find eller opret adresse
    const adresseResult = await pool.request()
      .input("vejNavn", sql.VarChar(255), vejNavn)
      .input("vejNummer", sql.VarChar(255), vejNummer)
      .input("etage", sql.Int, etage || null)
      .input("postnummer", sql.Int, Number(postnummer))
      .input("bynavn", sql.VarChar(255), bynavn)
      .query(`
        IF EXISTS (
          SELECT 1
          FROM Adresse
          WHERE vejNavn = @vejNavn
            AND vejNummer = @vejNummer
            AND postnummer = @postnummer
            AND bynavn = @bynavn
        )
        BEGIN
          SELECT adresseID
          FROM Adresse
          WHERE vejNavn = @vejNavn
            AND vejNummer = @vejNummer
            AND postnummer = @postnummer
            AND bynavn = @bynavn
        END
        ELSE
        BEGIN
          INSERT INTO Adresse (
            vejNavn,
            vejNummer,
            etage,
            postnummer,
            bynavn
          )
          OUTPUT INSERTED.adresseID
          VALUES (
            @vejNavn,
            @vejNummer,
            @etage,
            @postnummer,
            @bynavn
          )
        END
      `);

    const adresseID = adresseResult.recordset[0].adresseID;

    // Tjek for eksisterende ejendomsprofil
    const existingProfil = await pool.request()
  .input("brugerID", sql.Int, Number(brugerID))
  .input("adresseID", sql.Int, adresseID)
  .query(`
    SELECT ejendomsProfilID
    FROM EjendomsProfil
    WHERE brugerID = @brugerID
      AND adresseID = @adresseID
  `);

if (existingProfil.recordset.length > 0) {
  return res.status(409).json({
    success: false,
    message: "Denne ejendomsprofil findes allerede."
  });
}

    // 2. Opret ejendomsprofil
    const profilResult = await pool.request()
      .input("brugerID", sql.Int, Number(brugerID))
      .input("adresseID", sql.Int, adresseID)
      .input("ejendomstype", sql.VarChar(50), ejendomstype || "Ukendt")
      .input("byggeAar", sql.Int, Number(byggeAar) || null)
      .input("boligArealM2", sql.Decimal(10, 2), Number(boligArealM2) || 0)
      .input("antalVaerelser", sql.Int, Number(antalVaerelser) || null)
      .input("grundArealM2", sql.Decimal(10, 2), Number(grundArealM2) || null)
      .query(`
        INSERT INTO EjendomsProfil (
          brugerID,
          adresseID,
          ejendomstype,
          byggeAar,
          boligArealM2,
          antalVaerelser,
          grundArealM2
        )
        OUTPUT INSERTED.ejendomsProfilID
        VALUES (
          @brugerID,
          @adresseID,
          @ejendomstype,
          @byggeAar,
          @boligArealM2,
          @antalVaerelser,
          @grundArealM2
        )
      `);

    res.status(201).json({
      success: true,
      adresseID,
      ejendomsProfilID: profilResult.recordset[0].ejendomsProfilID
    });

  } catch (error) {
    console.error("Fejl ved oprettelse af ejendomsprofil:", error);

    res.status(500).json({
      success: false,
      message: "Kunne ikke oprette ejendomsprofil"
    });
  }
});

router.get("/users/:brugerID/ejendomsprofiler", async (req, res) => {
  try {
    const { brugerID } = req.params;
    const pool = await db.connect();

    const result = await pool.request()
      .input("brugerID", sql.Int, Number(brugerID))
      .query(`
        SELECT 
          ep.ejendomsProfilID AS id,
          a.vejNavn,
          a.vejNummer,
          a.postnummer,
          a.bynavn,
          ep.datoOprettet,
          ep.datoAendret,
          COUNT(ic.investeringsCaseID) AS antalCases
        FROM EjendomsProfil ep
        INNER JOIN Adresse a ON ep.adresseID = a.adresseID
        LEFT JOIN InvesteringsCase ic ON ep.ejendomsProfilID = ic.ejendomsProfilID
        WHERE ep.brugerID = @brugerID
        GROUP BY 
          ep.ejendomsProfilID,
          a.vejNavn,
          a.vejNummer,
          a.postnummer,
          a.bynavn,
          ep.datoOprettet,
          ep.datoAendret
        ORDER BY ep.datoOprettet DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Fejl ved hentning af ejendomsprofiler:", error);
    res.status(500).json({ success: false, message: "Kunne ikke hente ejendomme." });
  }
});

router.delete("/ejendomsprofiler/:id", async (req, res) => {
  let transaction;

  try {
    const { id } = req.params;
    const pool = await db.connect();
    transaction = new sql.Transaction(pool);

    await transaction.begin();

    // Find alle investeringscases til ejendomsprofilen
    const casesResult = await new sql.Request(transaction)
      .input("ejendomsProfilID", sql.Int, Number(id))
      .query(`
        SELECT investeringsCaseID
        FROM InvesteringsCase
        WHERE ejendomsProfilID = @ejendomsProfilID
      `);

    for (const c of casesResult.recordset) {
      await new sql.Request(transaction)
        .input("investeringsCaseID", sql.Int, c.investeringsCaseID)
        .query(`
          DELETE FROM Udlejning WHERE investeringsCaseID = @investeringsCaseID;
          DELETE FROM Laan WHERE investeringsCaseID = @investeringsCaseID;
          DELETE FROM Renovation WHERE investeringsCaseID = @investeringsCaseID;
          DELETE FROM KoebsOmkostninger WHERE investeringsCaseID = @investeringsCaseID;
          DELETE FROM InvesteringsCase WHERE investeringsCaseID = @investeringsCaseID;
        `);
    }

    // Slet selve ejendomsprofilen
    await new sql.Request(transaction)
      .input("ejendomsProfilID", sql.Int, Number(id))
      .query(`
        DELETE FROM EjendomsProfil
        WHERE ejendomsProfilID = @ejendomsProfilID
      `);

    await transaction.commit();

    res.json({
      success: true,
      message: "Ejendomsprofil slettet"
    });

  } catch (error) {
    console.error("Fejl ved sletning af ejendomsprofil:", error);

    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({
      success: false,
      message: "Kunne ikke slette ejendomsprofil."
    });
  }
});

module.exports = router;