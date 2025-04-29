import sql from "mssql";
import configs from "../config.js";
const { config } = configs;
import { logger } from "../utils/logger.js";

// ==============================================
// Fetch online count from the database
// ==============================================
export async function fetchOnlineCount(pool) {
  try {
    const QUERY = 'SELECT COUNT(*) AS OnlineCount FROM AuthTable WHERE online = @online';
    const request = pool.request();
    request.input('online', sql.Int, 1);
    const result = await request.query(QUERY);
    return result.recordset[0].OnlineCount;
  } catch (error) {
    logger.error('Online count query failed:', error);
    throw error;
  }
}