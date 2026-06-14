const mysql = require('mysql2/promise');

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'Jxx15760020920..';
const DB_NAME = 'bloger_db';

async function updateDB() {
  const connection = await mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: DB_NAME
  });

  try {
    await connection.query(`ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'`);
    console.log('Added avatar column');
  } catch(e) { console.log(e.message); }

  try {
    await connection.query(`ALTER TABLE users ADD COLUMN username VARCHAR(100)`);
    console.log('Added username column');
  } catch(e) { console.log(e.message); }
  
  await connection.end();
}
updateDB();
