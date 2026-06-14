const sqliteDB = require('./db_sqlite');
require('dotenv').config();

let pool = null;
let dbMode = 'sqlite';

const mysqlPassword = process.env.MYSQL_PASSWORD || '';
const useMySQL = mysqlPassword && mysqlPassword.length > 0 && mysqlPassword !== 'Jxx15760020920..';

async function initMySQL() {
  const mysql = require('mysql2/promise');
  try {
    const p = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: mysqlPassword,
      database: process.env.MYSQL_DATABASE || 'bloger_db',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 3000,
    });
    await p.query('SELECT 1');
    console.log('[DB] MySQL connected');
    return p;
  } catch (err) {
    console.log(`[DB] MySQL unavailable, using SQLite`);
    return null;
  }
}

// Lazy init on first query
async function dbQuery(sql, params = []) {
  if (!pool) {
    if (useMySQL) {
      pool = await initMySQL();
    }
    if (!pool) {
      dbMode = 'sqlite';
      pool = sqliteDB;
    } else {
      dbMode = 'mysql';
    }
  }
  return pool.query(sql, params);
}

dbQuery.getMode = () => dbMode;

module.exports = { query: dbQuery };
