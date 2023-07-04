const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const { logger } = require('../utils/logger');
const sql = require('mssql');
const { authDBConfig } = require('../utils/dbConfig.js');

// Set up the cache
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Route for getting the count of online players
router.get('/', async (req, res) => {
  try {
    // Check if the count exists in the cache
    const cacheKey = 'onlineCount';
    let count = cache.get(cacheKey);

    if (count === undefined) {
      // Count not found in cache, fetch it from the database
      const connAuth = new sql.ConnectionPool(authDBConfig);
      await connAuth.connect();

      const request = connAuth.request();

      // Declare the @online parameter and set its value to 1
      request.input('online', sql.Int, 1);

      const result = await request.query('SELECT COUNT(*) AS OnlineCount FROM AuthTable WHERE online = @online');

      count = result.recordset[0].OnlineCount;

      // Store the count in the cache
      cache.set(cacheKey, count);

      // Close the database connection
      await connAuth.close();
    }

    // Return the count as the response
    return res.status(200).json({ count });
  } catch (error) {
    logger.error('Database query failed: ' + error.message);
    return res.status(500).send('Database query failed. Please try again later.');
  }
});

module.exports = router;
