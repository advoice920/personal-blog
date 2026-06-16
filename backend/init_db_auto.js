// 数据库表自动初始化（幂等 CREATE IF NOT EXISTS）
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initTables() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bloger_db',
  });

  // 先创建数据库
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE || 'bloger_db'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.query(`USE \`${process.env.MYSQL_DATABASE || 'bloger_db'}\``);

  const tables = {
    users: `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(128) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') DEFAULT 'user', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    articles: `CREATE TABLE IF NOT EXISTS articles (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), category VARCHAR(100),
      link VARCHAR(500), source VARCHAR(100), cover VARCHAR(500), summary TEXT,
      content LONGTEXT, views INT DEFAULT 0, likes INT DEFAULT 0, tags JSON,
      author_name VARCHAR(100), author_avatar VARCHAR(255), thumbnail VARCHAR(255),
      createdAt VARCHAR(255), status ENUM('published', 'draft') DEFAULT 'published',
      is_deleted BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    movie: `CREATE TABLE IF NOT EXISTS movie (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), rating FLOAT,
      year VARCHAR(20), director VARCHAR(100), genre VARCHAR(100), cover VARCHAR(255),
      \`desc\` TEXT, tags JSON, \`rank\` INT, is_deleted BOOLEAN DEFAULT FALSE,
      status ENUM('published', 'draft') DEFAULT 'published',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    music: `CREATE TABLE IF NOT EXISTS music (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), cover VARCHAR(255),
      creatorName VARCHAR(100), creatorAvatar VARCHAR(255), createDate VARCHAR(100),
      favCount VARCHAR(50), shareCount VARCHAR(50), commentCount VARCHAR(50),
      tags JSON, \`desc\` JSON, trackCount INT, playCount INT, songs JSON,
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    travel: `CREATE TABLE IF NOT EXISTS travel (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), location VARCHAR(255),
      duration VARCHAR(100), img VARCHAR(255), text TEXT, itinerary JSON, tips JSON,
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    photo: `CREATE TABLE IF NOT EXISTS photo (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), author VARCHAR(100),
      avatar VARCHAR(255), likes INT DEFAULT 0, views VARCHAR(50), url VARCHAR(500),
      width INT, height INT, category VARCHAR(100),
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    fashion: `CREATE TABLE IF NOT EXISTS fashion (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), brand VARCHAR(100),
      img VARCHAR(255), text TEXT, designer VARCHAR(100), collection VARCHAR(100),
      detailedReview TEXT, lookbook JSON,
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    reading: `CREATE TABLE IF NOT EXISTS reading (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), author VARCHAR(100),
      rating FLOAT, cover VARCHAR(255), tags JSON, summary TEXT, review TEXT, quote TEXT,
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    food: `CREATE TABLE IF NOT EXISTS food (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), author VARCHAR(100),
      time VARCHAR(100), calories VARCHAR(100), rating VARCHAR(20), img VARCHAR(255),
      height INT, ingredients JSON, steps JSON,
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    sports: `CREATE TABLE IF NOT EXISTS sports (
      id VARCHAR(128) PRIMARY KEY, title VARCHAR(255), type VARCHAR(100), distance VARCHAR(50),
      pace VARCHAR(50), hr VARCHAR(50), map VARCHAR(255), date VARCHAR(50), elevation VARCHAR(50),
      calories VARCHAR(50), description TEXT, splits JSON,
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    songs: `CREATE TABLE IF NOT EXISTS songs (
      id INT AUTO_INCREMENT PRIMARY KEY, netease_id BIGINT UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL, artist VARCHAR(255), album VARCHAR(255),
      duration INT DEFAULT 0, cover_url VARCHAR(500), audio_url VARCHAR(800), lyrics TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    comments: `CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY, module_name VARCHAR(50) NOT NULL,
      item_id INT NOT NULL, user_id INT, content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    likes_interaction: `CREATE TABLE IF NOT EXISTS likes_interaction (
      id INT AUTO_INCREMENT PRIMARY KEY, module_name VARCHAR(50) NOT NULL,
      item_id VARCHAR(128) NOT NULL, user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY user_item_module (user_id, item_id, module_name)
    )`,
    history: `CREATE TABLE IF NOT EXISTS history (
      id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, module_name VARCHAR(50) NOT NULL,
      item_id VARCHAR(128) NOT NULL, title VARCHAR(255), cover VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY user_item_module (user_id, item_id, module_name)
    )`,
  };

  for (const [name, sql] of Object.entries(tables)) {
    await connection.query(sql);
    console.log(`[DB] Table ${name} ready`);
  }

  // 创建管理员账户
  const adminEmail = '2518119419@qq.com';
  const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (existing.length === 0) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    await connection.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'admin')",
      ['admin', adminEmail, hashedPassword]
    );
    console.log('[DB] Admin user created');
  }

  await connection.end();
  console.log('[DB] All tables initialized');
}

module.exports = initTables;
