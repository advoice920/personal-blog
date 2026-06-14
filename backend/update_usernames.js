const mysql = require('mysql2/promise');

async function run() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Jxx15760020920..',
    database: 'bloger_db'
  });

  try {
    await c.query("UPDATE users SET username = SUBSTRING_INDEX(email, '@', 1) WHERE username IS NULL");
    console.log('Updated existing usernames');
  } catch (e) {
    console.error(e.message);
  } finally {
    c.end();
  }
}

run();
