// ── Importer moduler ──────────────────────────────────────────────────────────
require("dotenv").config();
const sql = require("mssql");

// ── Database-klasse med lazy connection pool ──────────────────────────────────
class Database {
  constructor() {
    this.config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };

    this.pool = null;
    this.connected = false;
  }

  // ── Forbind til database ────────────────────────────────────────────────────
  async connect() {
    try {
      if (this.pool && this.connected) {
        return this.pool;
      }

      this.pool = await sql.connect(this.config);
      this.connected = true;
      console.log("Forbundet til databasen");
      return this.pool;
    } catch (error) {
      this.connected = false;
      console.error("Kunne ikke forbinde til database:", error.message);
      throw error;
    }
  }

  // ── Afbryd forbindelsen ─────────────────────────────────────────────────────
  async disconnect() {
    try {
      if (this.pool && this.connected) {
        await this.pool.close();
        this.connected = false;
        this.pool = null;
        console.log("Database forbindelse lukket.");
      }
    } catch (error) {
      console.error("Fejl ved lukning af database:", error.message);
      throw error;
    }
  }

  // ── Opret SQL-request (bruges til parameteriserede forespørgsler) ───────────
  async request() {
    const pool = await this.connect();
    return pool.request();
  }

  // ── Kør rå SQL-forespørgsel ─────────────────────────────────────────────────
  async query(queryString) {
    const request = await this.request();
    return request.query(queryString);
  }
}

// ── Eksporter singleton-instans og sql-objekt ─────────────────────────────────
const database = new Database();

module.exports = {
  db: database,
  sql
};
