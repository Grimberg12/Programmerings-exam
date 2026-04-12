const express = require('express');
const router = express.Router();
const db = require('../services/db');

router.get('/test-db', async (req, res) => {
  try {
    await db.poolConnect;
    const result = await db.pool.request().query('SELECT 1 AS test');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;