const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');

const sqlitePath = path.join(__dirname, '../frontend/public/mock.sqlite');

async function seedArticles() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Jxx15760020920..',
    database: 'bloger_db'
  });

  const db = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY);
  db.all("SELECT * FROM article", async (err, rows) => {
    if (err) { console.error(err); return; }
    console.log(`Found ${rows.length} articles in SQLite.`);
    
    for (const row of rows) {
      const keys = Object.keys(row).join(', ');
      const values = Object.values(row);
      const placeholders = new Array(values.length).fill('?').join(', ');
      try {
        await connection.query(`INSERT IGNORE INTO articles (${keys}) VALUES (${placeholders})`, values);
      } catch (e) {
        console.log(e.message);
      }
    }
    console.log('Done seeding articles into MySQL.');
    await connection.end();
    db.close();
  });
}
seedArticles();
