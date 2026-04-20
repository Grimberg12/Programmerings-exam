const express = require("express");
const router = express.Router();
const { db, sql } = require("../services/db");

// POST /api/v1/users/login
router.post("/users/login", async (req, res) => {
  try {
    const { email, adgangskode } = req.body;

    if (!email || !adgangskode) {
      return res.status(400).json({
        success: false,
        message: "Email og adgangskode skal udfyldes."
      });
    }

    const request = await db.request();

    const result = await request
      .input("email", sql.VarChar, email)
      .query(`
        SELECT brugerID, navn, email, adgangskode, brugerStatus, erAktiv
        FROM Bruger
        WHERE email = @email
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Forkert email eller adgangskode."
      });
    }

    const bruger = result.recordset[0];

    if (!bruger.erAktiv) {
      return res.status(403).json({
        success: false,
        message: "Brugeren er ikke aktiv."
      });
    }

    if (bruger.adgangskode !== adgangskode) {
      return res.status(401).json({
        success: false,
        message: "Forkert email eller adgangskode."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login gennemført.",
      data: {
        brugerID: bruger.brugerID,
        navn: bruger.navn,
        email: bruger.email,
        brugerStatus: bruger.brugerStatus
      },
      redirectTo: "/index.html"
    });
  } catch (error) {
    console.error("Fejl ved login:", error);

    return res.status(500).json({
      success: false,
      message: "Der opstod en serverfejl ved login."
    });
  }
});

module.exports = router;