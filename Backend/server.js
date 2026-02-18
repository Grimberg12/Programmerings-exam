const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// Database connection
const pool = new Pool({
  user: "postgres",
  host: "127.0.0.1",
  database: "examdb",
  password: "postgres",
  port: 5433,
});

// Test DB connection when server starts
pool.connect()
  .then(() => {
    console.log("Connected to database successfully");
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });

// Health route
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

// Users route
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id;");
    res.json({ ok: true, users: result.rows });
  } catch (error) {
    console.error("DB ERROR:", error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

