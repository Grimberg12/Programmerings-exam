const express = require("express");
const router = express.Router();

// Importerer service på serversiden
const { hentAdresseAutocomplete } = require("../../Frontend/js/bbrService");

// Endpoint som frontend kan kalde
router.get("/bbr/autocomplete", async (req, res) => {
  try {
    const q = req.query.q;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Mangler søgetekst"
      });
    }

    const resultater = await hentAdresseAutocomplete(q);

    res.json({
      success: true,
      data: resultater
    });
  } catch (error) {
    console.error("Fejl i autocomplete-route:", error);
    res.status(500).json({
      success: false,
      message: "Fejl ved hentning af adresser"
    });
  }
});

module.exports = router;