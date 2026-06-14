const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const sqlitePath = path.join(__dirname, '../frontend/public/mock.sqlite');
const db = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log('Connected to the mock.sqlite database.');
});

db.serialize(() => {
  db.all("SELECT name, sql FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      throw err;
    }
    console.log(JSON.stringify(tables, null, 2));

    const tableData = {};
    let pending = tables.length;
    
    if (pending === 0) return;
    
    tables.forEach((table) => {
      if (table.name !== 'sqlite_sequence') {
        db.all(`SELECT * FROM ${table.name} LIMIT 1`, [], (err, rows) => {
          if (err) throw err;
          tableData[table.name] = rows;
          pending--;
          if (pending === 0 || (pending === 1 && tables.find(t => t.name === 'sqlite_sequence') && !tableData['sqlite_sequence'])) {
             console.log('--- DATA SAMPLE ---');
             console.log(JSON.stringify(tableData, null, 2));
             db.close();
          }
        });
      } else {
        pending--;
        if (pending === 0) {
           console.log('--- DATA SAMPLE ---');
           console.log(JSON.stringify(tableData, null, 2));
           db.close();
        }
      }
    });
  });
});
