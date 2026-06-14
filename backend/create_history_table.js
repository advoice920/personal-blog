const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Jxx15760020920..',
    database: 'bloger_db'
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      module_name VARCHAR(50) NOT NULL,
      item_id VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      cover VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY user_item_module (user_id, item_id, module_name)
    )
  `);
  console.log('History table created successfully.');
  await conn.end();
}
run();
