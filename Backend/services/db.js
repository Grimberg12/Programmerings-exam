/**
 * Database connection placeholder.
 *
 * This file is intended to provide a single place to wire up an Azure database
 * connection (e.g. Azure SQL / SQL Server) when you're ready.
 *
 * Steps to connect:
 *   1) Install a driver, example:
 *        npm install mssql
 *   2) Set an environment variable:
 *        AZURE_SQL_CONNECTION_STRING="<your-connection-string>"
 *   3) Implement the `connect()` logic below and call it from your app.
 */

const config = {
  connectionString: process.env.AZURE_SQL_CONNECTION_STRING || "",
};

let pool = null;

async function connect() {
  if (!config.connectionString) {
    throw new Error(
      "Azure DB connection string not set. Set AZURE_SQL_CONNECTION_STRING in your environment."
    );
  }

  // TODO: Implement the actual driver connection.
  // Example (after installing 'mssql'):
  // const sql = require("mssql");
  // pool = await sql.connect(config.connectionString);
  // return pool;

  throw new Error(
    "Database connection not implemented. Install 'mssql' and implement connect() in services/db.js."
  );
}

function getPool() {
  if (!pool) {
    throw new Error("Database is not connected. Call connect() first.");
  }

  return pool;
}

export default {
  connect,
  getPool,
};
