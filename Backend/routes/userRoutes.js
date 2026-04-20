const express = require("express");
const router = express.Router();
const { db, sql } = require("../services/db");

// POST /api/v1/users/register
router.post("/users/register", async (req, res) => {
  try {
    const {
      fornavn,
      efternavn,
      telefonnummer,
      email,
      adgangskode,
      accepteretVilkaar
    } = req.body;

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

    const navn = `${fornavn} ${efternavn}`;

    const existingUserRequest = await db.request();
    const existingUser = await existingUserRequest
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

    const insertRequest = await db.request();
    const result = await insertRequest
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