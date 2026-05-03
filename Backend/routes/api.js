// ── Kan muligvis slettes: debug-log fra udviklingsperioden ───────────────────
console.log("LOADER: Backend/routes/api.js");

// ── Importer moduler ──────────────────────────────────────────────────────────
const express = require("express");

const router = express.Router();

// ── Importer routes ───────────────────────────────────────────────────────────
const testDbRouter = require("./testRouteDB");
const userRoutes = require("./userRoutes");
const loginRoutes = require("./loginRoutes");
const investmentcaseRoute = require("./investmentcaseRoute");
const ejendomsprofilRoute = require("./ejendomsprofilRoute");
const bbrRoutes = require("./bbrRoutes");

// ── Health-check endpoint ─────────────────────────────────────────────────────
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API virker",
  });
});

// ── Monter routes ─────────────────────────────────────────────────────────────
router.use("/", testDbRouter);
router.use("/", userRoutes);
router.use("/", loginRoutes);
router.use("/", investmentcaseRoute);
router.use("/", ejendomsprofilRoute);
router.use("/", bbrRoutes);

// ── Kan muligvis slettes: debug-log fra udviklingsperioden ───────────────────
console.log("MONTERER: bbrRoutes i api.js");

// ── Eksporter router ──────────────────────────────────────────────────────────
module.exports = router;
