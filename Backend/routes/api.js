console.log("LOADER: Backend/routes/api.js");
// Importerer Express
const express = require("express");

// Opretter router
const router = express.Router();

// Importerer eksisterende routes
const testDbRouter = require("./testRouteDB");
const userRoutes = require("./userRoutes");
const loginRoutes = require("./loginRoutes");
const investmentcaseRoute = require("./investmentcaseRoute");

// Importerer BBR-routes
const bbrRoutes = require("./bbrRoutes");

// Health-check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API virker",
  });
});

// Kobler eksisterende routes på
router.use("/", testDbRouter);
router.use("/", userRoutes);
router.use("/", loginRoutes);
router.use("/", investmentcaseRoute);

// Kobler BBR-routes på API'et
router.use("/", bbrRoutes);
console.log("MONTERER: bbrRoutes i api.js");
// Eksporterer routeren
module.exports = router;