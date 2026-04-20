// Indlæser miljøvariabler fra .env-filen
require("dotenv").config();

// Standard app-indstillinger
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Datafordeler-indstillinger
const DATAFORDELER_USERNAME = process.env.DATAFORDELER_USERNAME || "";
const DATAFORDELER_PASSWORD = process.env.DATAFORDELER_PASSWORD || "";
const DATAFORDELER_BASE_URL =
  process.env.DATAFORDELER_BASE_URL || "https://services.datafordeler.dk";

// Eksporterer alle værdier samlet,
// så andre backend-filer kan importere dem herfra
module.exports = {
  PORT,
  NODE_ENV,
  DATAFORDELER_USERNAME,
  DATAFORDELER_PASSWORD,
  DATAFORDELER_BASE_URL,
};