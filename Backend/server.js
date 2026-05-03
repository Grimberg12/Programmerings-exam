// ── Importer moduler ──────────────────────────────────────────────────────────
const express = require("express");
const path = require("path");

const apiRouter = require("./routes/api");
const webhookRouter = require("./routes/webhooks");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const { db } = require("./services/db");

const { PORT, NODE_ENV } = require("./config/env");

const app = express();

// ── Body-parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ── Logger ────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", req.body);
  }
  next();
});

// ── Statiske mapper ───────────────────────────────────────────────────────────
app.use("/css", express.static(path.join(__dirname, "../Frontend/css")));
app.use("/js", express.static(path.join(__dirname, "../Frontend/js")));
app.use("/layout", express.static(path.join(__dirname, "../Frontend/layout")));
app.use("/pictures", express.static(path.join(__dirname, "../Frontend/pictures")));

app.use(express.static(path.join(__dirname, "../Frontend/public")));

// ── API og webhook routes ─────────────────────────────────────────────────────
app.use("/api/v1", apiRouter);
app.use("/webhooks", webhookRouter);

// ── Fejlhåndtering ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
db.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server kører på port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Kunne ikke starte server pga. databasefejl:", error.message);
    process.exit(1);
  });
