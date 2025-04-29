import { Router } from 'express';
import sql from 'mssql';
const router = Router();
import NodeCache from 'node-cache';
import { logger } from '../utils/logger.js';
import { authDBConfig } from '../utils/dbConfig.js';
import { fetchOnlineCount } from "../services/authDBService.js";

const CACHE_KEY = 'onlineCount';
const CACHE_TTL = 60; // 1 minute
const CHECK_PERIOD = 120; // 2 minutes

// Cache configuration
const cache = new NodeCache({ 
  stdTTL: CACHE_TTL, 
  checkperiod: CHECK_PERIOD,
  useClones: false
});

// Database connection pool
let pool;
let poolReady = (async () => {
  try {
    pool = await new sql.ConnectionPool(authDBConfig).connect();
  } catch (error) {
    logger.error('Failed to create database connection pool:', error);
    process.exit(1);
  }
})();

/**
 * Gets online count, using cache when possible
 */
async function getOnlineCount() {
  try {
    // Try to get from cache first
    let count = cache.get(CACHE_KEY);
    
    if (count === undefined) {
      logger.debug('Cache miss for online count, querying database');
      count = await fetchOnlineCount(pool);
      cache.set(CACHE_KEY, count);
    } else {
      logger.debug('Online count retrieved from cache');
    }
    
    return count;
  } catch (error) {
    // If we have a cached value, return it even if the query fails
    const cached = cache.get(CACHE_KEY);
    if (cached !== undefined) {
      logger.warn('Using cached online count due to database error');
      return cached;
    }
    throw error;
  }
}

// Route for getting online players count
router.get('/', async (req, res) => {
  try {
    if (!pool) await poolReady;
    
    const count = await getOnlineCount();
    
    // Set cache-control headers
    res.set('Cache-Control', `public, max-age=${CACHE_TTL}`);
    
    return res.status(200).json({ 
      count,
      cached: cache.has(CACHE_KEY),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get online count:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Unable to retrieve online player count'
    });
  }
});

// Cleanup on process exit
process.on('SIGINT', async () => {
  try {
    if (pool) {
      await pool.close();
    }
    process.exit(0);
  } catch (error) {
    logger.error('Error closing connection pool:', error);
    process.exit(1);
  }
});

export default router;