/**
 * Database connection placeholder.
 *
 * This file is intended to provide a single place to wire up an Azure database
 * connection (e.g. Azure SQL / SQL Server) when you're ready.
 *
 * Steps to connect:
 *   1) Install a driver, example:
 *        npm install mssql
 *   3) Implement the `connect()` logic below and call it from your app.
 */

require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};
// Lazy connection - gjøres kun når eksplicit anmodet
let pool = null;
let poolConnect = null;

const getPool = async () => {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    pool.on('error', err => {
      console.error('SQL pool error:', err);
    });
  }
  
  if (!poolConnect) {
    try {
      poolConnect = await pool.connect();
      console.log('✓ Forbundet til databasen');
    } catch (err) {
      console.error('✗ Kunne ikke forbinde til database:', err.message);
      throw err;
    }
  }
  
  return pool;
};

module.exports = {
  sql,
  getPool,
  async connect() {
    return getPool();
  }
};

console.log("DB CONFIG TEST:");
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_SERVER:", process.env.DB_SERVER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PASSWORD EXISTS:", !!process.env.DB_PASSWORD);