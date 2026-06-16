const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, '..', 'mock.sqlite');

let db = null;

async function getDB() {
  if (!db) {
    const SQL = await initSqlJs();
    if (fs.existsSync(SQLITE_PATH)) {
      const buffer = fs.readFileSync(SQLITE_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

function saveDB() {
  if (db && !process.env.VERCEL) {
    const data = db.export();
    const dir = path.dirname(SQLITE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SQLITE_PATH, Buffer.from(data));
  }
}

/**
 * Fix MySQL-specific syntax to make it compatible with SQLite
 */
function fixSQL(sql) {
  return sql
    .replace(/JSON_CONTAINS\(/gi, 'INSTR(')
    .replace(/\bIF\s*\(/gi, 'IIF(')
    .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
    .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '')
    .replace(/ENUM\s*\([^)]+\)/gi, 'TEXT')
    .replace(/\bNOW\s*\(\s*\)/gi, "datetime('now')")
    .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')");
}

// Wrapper that mimics mysql2/promise query interface
async function query(sql, params = []) {
  const sdb = await getDB();
  const trimmed = sql.trim().toUpperCase();
  const fixedSQL = fixSQL(sql);

  if (trimmed.startsWith('INSERT')) {
    sdb.run(fixedSQL, params);
    const lastId = sdb.exec("SELECT last_insert_rowid()")[0].values[0][0];
    const changes = sdb.getRowsModified();
    saveDB();
    return [{ insertId: lastId, affectedRows: changes }];
  } else if (trimmed.startsWith('UPDATE') || trimmed.startsWith('DELETE')) {
    sdb.run(fixedSQL, params);
    const changes = sdb.getRowsModified();
    saveDB();
    return [{ affectedRows: changes }];
  } else if (trimmed.startsWith('SELECT')) {
    const stmt = sdb.prepare(fixedSQL);
    if (params && params.length > 0) stmt.bind(params);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return [rows];
  } else {
    // CREATE, ALTER, DROP etc.
    sdb.run(fixedSQL, params);
    saveDB();
    return [];
  }
}

module.exports = { query, getDB };
