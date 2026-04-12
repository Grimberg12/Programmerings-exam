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
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();
pool.on('error', err => {
  console.error('SQL pool error:', err);
});

module.exports = {
  sql,
  pool,
  poolConnect
};