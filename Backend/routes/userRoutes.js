const express = require("express");
const router = express.Router();
const db = require("../services/db");
const sql = db.sql;

// POST /api/v1/users/register
router.post("/users/register", async (req, res) => {
  try {
    // Henter data fra request body
    const {
      fornavn,
      efternavn,
      telefonnummer,
      email,
      adgangskode,
      accepteretVilkaar
    } = req.body;

    // Simpel server-side validering
    if (!fornavn || !efternavn || !telefonnummer || !email || !adgangskode) {
      return res.status(400).json({
        success: false,
        message: "Alle felter skal udfyldes."
      });
    }

    if (!accepteretVilkaar) {
      return res.status(400).json({
        success: false,
        message: "Vilkår skal accepteres."
      });
    }

    // Samler fuldt navn, fordi jeres database har kolonnen 'navn'
    const navn = `${fornavn} ${efternavn}`;

    // Venter på at connection pool er klar
    await db.poolConnect;

    // Tjekker om email allerede findes
    const existingUser = await db.pool.request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT brugerID
        FROM Bruger
        WHERE email = @email
      `);

    if (existingUser.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Denne email er allerede oprettet."
      });
    }

    // Indsætter brugeren i databasen
    const result = await db.pool.request()
      .input("navn", sql.VarChar, navn)
      .input("email", sql.VarChar, email)
      .input("telefonnummer", sql.VarChar, telefonnummer)
      .input("adgangskode", sql.VarChar, adgangskode)
      .input("brugerStatus", sql.VarChar, "Freemium")
      .input("erAktiv", sql.Bit, true)
      .input("accepteretVilkaar", sql.Bit, true)
      .query(`
        INSERT INTO Bruger (
          navn,
          email,
          telefonnummer,
          adgangskode,
          brugerStatus,
          erAktiv,
          accepteretVilkaar
        )
        OUTPUT
          INSERTED.brugerID,
          INSERTED.navn,
          INSERTED.email,
          INSERTED.telefonnummer,
          INSERTED.brugerStatus,
          INSERTED.erAktiv,
          INSERTED.accepteretVilkaar
        VALUES (
          @navn,
          @email,
          @telefonnummer,
          @adgangskode,
          @brugerStatus,
          @erAktiv,
          @accepteretVilkaar
        )
      `);

    return res.status(201).json({
      success: true,
      message: "Brugeren blev oprettet.",
      data: result.recordset[0]
    });

  } catch (error) {
    console.error("Fejl ved oprettelse af bruger:", error);

    return res.status(500).json({
      success: false,
      message: "Der opstod en serverfejl ved oprettelse af bruger."
    });
  }
});

module.exports = router;