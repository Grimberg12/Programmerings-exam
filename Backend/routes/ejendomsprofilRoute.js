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
          ep.datoOprettet
        ORDER BY ep.datoOprettet DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Fejl ved hentning af ejendomsprofiler:", error);
    res.status(500).json({ success: false, message: "Kunne ikke hente ejendomme." });
  }
});

module.exports = router;