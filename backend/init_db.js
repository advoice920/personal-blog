const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'root';
const DB_NAME = 'bloger_db';

const sqlitePath = path.join(__dirname, '../frontend/public/mock.sqlite');

async function getSqliteData() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    db.serialize(() => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) return reject(err);
        
        const tableData = {};
        let pending = tables.length;
        
        if (pending === 0) return resolve(tableData);
        
        tables.forEach((table) => {
          if (table.name !== 'sqlite_sequence') {
            db.all(`SELECT * FROM ${table.name}`, [], (err, rows) => {
              if (err) return reject(err);
              tableData[table.name] = rows;
              pending--;
              if (pending === 0) resolve(tableData);
            });
          } else {
            pending--;
            if (pending === 0) resolve(tableData);
          }
        });
      });
    });
  });
}

async function initDB() {
  let connection;
  try {
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD
    });

    console.log(`Creating database ${DB_NAME} if it does not exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${DB_NAME}\``);

    // Create tables
    console.log('Creating tables...');

    // Users
 await connection.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
    // Add super admin
    const adminEmail = '2518119419@qq.com';
const adminPasswordRaw = '123456';
const [existingAdmin] = await connection.query(`SELECT * FROM users WHERE email = ?`, [adminEmail]);
const hashedPassword = await bcrypt.hash(adminPasswordRaw, 10);
if (existingAdmin.length === 0) {
  // 新增 username 字段，值固定为 admin
  await connection.query(
    `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'admin')`,
    ['admin', adminEmail, hashedPassword]
  );
  console.log('Super admin user created.');
} else {
  await connection.query(
    `UPDATE users SET password = ? WHERE email = ?`,
    [hashedPassword, adminEmail]
  );
  console.log('Super admin password updated.');
}

    // Tables for basic content
    // Based on SQLite schema we found
    const schemaDefs = {
  articles: `id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), category VARCHAR(100), link VARCHAR(255), source VARCHAR(255), cover VARCHAR(255), summary TEXT, content LONGTEXT, views INT DEFAULT 0, likes INT DEFAULT 0, tags JSON, author_name VARCHAR(100), author_avatar VARCHAR(255), thumbnail VARCHAR(255), createdAt VARCHAR(255), status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  music: `id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), cover VARCHAR(255), creatorName VARCHAR(100), creatorAvatar VARCHAR(255), createDate VARCHAR(100), favCount VARCHAR(50), shareCount VARCHAR(50), commentCount VARCHAR(50), tags JSON, \`desc\` JSON, trackCount INT, playCount INT, songs JSON, status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  movie: `id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), rating FLOAT, year VARCHAR(20), director VARCHAR(100), genre VARCHAR(100), cover VARCHAR(255), \`desc\` TEXT, tags JSON, \`rank\` INT, status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  travel: `id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), location VARCHAR(255), duration VARCHAR(100), img VARCHAR(255), text TEXT, itinerary JSON, tips JSON, status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  photo: `id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), author VARCHAR(100), avatar VARCHAR(255), likes INT DEFAULT 0, views VARCHAR(50), url VARCHAR(255), width INT, height INT, category VARCHAR(100), status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  fashion: `id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), brand VARCHAR(100), img VARCHAR(255), text TEXT, designer VARCHAR(100), collection VARCHAR(100), detailedReview TEXT, lookbook JSON, status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  reading: `id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), author VARCHAR(100), rating FLOAT, cover VARCHAR(255), tags JSON, summary TEXT, review TEXT, quote TEXT, status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  food: `id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), author VARCHAR(100), time VARCHAR(100), calories VARCHAR(100), rating VARCHAR(20), img VARCHAR(255), height INT, ingredients JSON, steps JSON, status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  // 此处修改sports主键长度 255→128
  sports: `id VARCHAR(128) PRIMARY KEY, title VARCHAR(255), type VARCHAR(100), distance VARCHAR(50), pace VARCHAR(50), hr VARCHAR(50), map VARCHAR(255), date VARCHAR(50), elevation VARCHAR(50), calories VARCHAR(50), description TEXT, splits JSON, status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
};

    for (const [tableName, columns] of Object.entries(schemaDefs)) {
      await connection.query(`CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`);
      // Since we want to re-seed, we might just TRUNCATE the tables first for a clean state
      // but let's just use INSERT IGNORE for simplicity
    }

    // Songs table (real music from NetEase)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        netease_id BIGINT UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        artist VARCHAR(255),
        album VARCHAR(255),
        duration INT DEFAULT 0,
        cover_url VARCHAR(500),
        audio_url VARCHAR(800),
        lyrics TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Interaction tables (for extending features)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_name VARCHAR(50) NOT NULL, -- e.g. 'articles', 'food', etc
        item_id INT NOT NULL,
        user_id INT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS likes_interaction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_name VARCHAR(50) NOT NULL,
  item_id VARCHAR(128) NOT NULL, -- 255改128
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_item_module (user_id, item_id, module_name)
)
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  module_name VARCHAR(50) NOT NULL,
  item_id VARCHAR(128) NOT NULL,
  title VARCHAR(255),
  cover VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_item_module (user_id, item_id, module_name)
)
    `);

    // Seed Data
    console.log('Seeding data from SQLite...');
    const sqliteData = await getSqliteData();
    for (const [tableName, rows] of Object.entries(sqliteData)) {
      if (schemaDefs[tableName] && rows.length > 0) {
        for (const row of rows) {
          const keys = Object.keys(row).map(k => (k === 'desc' || k === 'rank') ? '\`' + k + '\`' : k).join(', ');
          const values = Object.values(row);
          const placeholders = new Array(values.length).fill('?').join(', ');
          
          try {
            await connection.query(`INSERT IGNORE INTO ${tableName} (${keys}) VALUES (${placeholders})`, values);
          } catch (insertErr) {
             console.error(`Error inserting into ${tableName}:`, insertErr.message);
          }
        }
        console.log(`Seeded table ${tableName} with ${rows.length} rows.`);
      }
    }

    console.log('Database initialization and seeding completed successfully.');
  } catch (err) {
    console.error('Error during database initialization:', err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDB();
