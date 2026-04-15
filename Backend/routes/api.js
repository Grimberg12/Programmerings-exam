const express = require("express");
const router = express.Router();

// Importerer route til test af databaseforbindelse
const testDbRouter = require("./testRouteDB");
const userRoutes = require("./userRoutes");
const loginRoutes = require("./loginRoutes");
const investmentcaseRoute = require("./investmentcaseRoute");

// Health-check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API virker",
  });
});

// Tilføjer route til test af database
router.use("/", testDbRouter);
router.use("/", userRoutes);
router.use("/", loginRoutes);
router.use("/", investmentcaseRoute);

module.exports = router;