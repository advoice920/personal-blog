const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const mysql = require('mysql2/promise');

const sqlitePath = path.join(__dirname, '../frontend/public/mock.sqlite');

async function run() {
  // Update SQLite
  const db = new sqlite3.Database(sqlitePath, (err) => {
    if (err) {
      console.error(err.message);
      process.exit(1);
    }
    console.log('Connected to the SQLite database.');
  });

  db.serialize(() => {
    db.all("SELECT id, title, cover FROM reading WHERE cover LIKE '%doubanio%' OR cover LIKE '%picsum%'", [], (err, rows) => {
      if (err) return console.error(err.message);
      
      if (rows.length === 0) {
        console.log('No books found needing cover updates.');
      } else {
        const stmt = db.prepare('UPDATE reading SET cover = ? WHERE id = ?');
        rows.forEach(row => {
          const newCover = `https://tse2-mm.cn.bing.net/th?q=${encodeURIComponent(row.title + ' 实体书 封面')}&w=400&h=600&c=7&rs=1&p=0&dpr=1&pid=1.7&mkt=zh-CN`;
          stmt.run([newCover, row.id], (err) => {
            if (err) console.error('Error updating row:', err.message);
          });
        });
        stmt.finalize(async () => {
          console.log(`Successfully updated ${rows.length} book covers in SQLite.`);
          
          // Truncate MySQL table so init_db.js will re-seed it
          try {
            const conn = await mysql.createConnection({host:'localhost', user:'root', password:'Jxx15760020920..', database:'bloger_db'});
            await conn.query('TRUNCATE TABLE reading');
            console.log('Truncated MySQL reading table.');
            await conn.end();
          } catch (e) {
            console.error('MySQL truncate error:', e.message);
          }
          
          db.close();
        });
      }
    });
  });
}

run();
