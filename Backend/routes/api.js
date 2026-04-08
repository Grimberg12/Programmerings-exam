/*
  * API routes for the application.
  * ændres senere, når vi har konkrete endpoints at implementere.
*/
const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API virker",
  });
});

module.exports = router;