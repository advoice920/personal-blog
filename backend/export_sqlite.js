/**
 * 导出 MySQL 数据到 SQLite 文件
 * 用法: node export_sqlite.js
 * 生成: ../frontend/public/mock.sqlite
 */
const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'bloger_db',
};

const SQLITE_PATH = path.join(__dirname, '..', 'frontend', 'public', 'mock.sqlite');

const TABLES = ['users', 'articles', 'songs', 'music', 'food', 'travel', 'reading',
  'fashion', 'sports', 'photo', 'movie', 'comments', 'likes_interaction', 'history'];

function execSQL(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    } else {
      db.run(sql, params, function(err) { err ? reject(err) : resolve(this); });
    }
  });
}

async function exportDB() {
  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection(MYSQL_CONFIG);

  // Export to temp file first, then replace (avoids file lock issues)
  const TMP_PATH = SQLITE_PATH + '.tmp';
  if (fs.existsSync(TMP_PATH)) fs.unlinkSync(TMP_PATH);

  const db = new sqlite3.Database(TMP_PATH);
  await execSQL(db, 'PRAGMA journal_mode = OFF');

  for (const table of TABLES) {
    try {
      const [cols] = await conn.query(`SHOW COLUMNS FROM ${table}`);
      console.log(`📦 ${table}: ${cols.length} cols...`);

      const colDefs = cols.map(c => {
        let type = 'TEXT';
        if (/int|INT/.test(c.Type)) type = 'INTEGER';
        else if (/float|double|decimal/.test(c.Type)) type = 'REAL';
        return `"${c.Field}" ${type}`;
      }).join(', ');

      await execSQL(db, `DROP TABLE IF EXISTS "${table}"`);
      await execSQL(db, `CREATE TABLE "${table}" (${colDefs})`);

      const [rows] = await conn.query(`SELECT * FROM ${table}`);
      if (rows.length === 0) { console.log(`  → empty`); continue; }

      const fields = cols.map(c => `"${c.Field}"`).join(', ');
      const ph = cols.map(() => '?').join(', ');
      const stmt = `INSERT INTO "${table}" (${fields}) VALUES (${ph})`;

      // Insert in batches
      for (const row of rows) {
        const vals = cols.map(c => {
          const v = row[c.Field];
          if (v === null || v === undefined) return null;
          if (typeof v === 'object') return JSON.stringify(v);
          return v;
        });
        await execSQL(db, stmt, vals);
      }
      console.log(`  → ${rows.length} rows`);
    } catch (err) {
      console.log(`  ⚠️ Skipped: ${err.message.substring(0, 50)}`);
    }
  }

  db.close();
  await conn.end();

  // 替换原文件
  if (fs.existsSync(SQLITE_PATH)) fs.unlinkSync(SQLITE_PATH);
  fs.renameSync(TMP_PATH, SQLITE_PATH);
  const size = (fs.statSync(SQLITE_PATH).size / 1024).toFixed(1);
  console.log(`\n✅ 导出完成: ${SQLITE_PATH} (${size} KB)`);
}

exportDB().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
