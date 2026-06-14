import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateDB() {
  const SQL = await initSqlJs()
  const db = new SQL.Database()

  console.log('Generating SQLite database...')

  // CREATE TABLES
  db.run(`
    CREATE TABLE IF NOT EXISTS article (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      category TEXT,
      summary TEXT,
      content TEXT,
      views INTEGER,
      likes INTEGER,
      tags TEXT,
      author_name TEXT,
      author_avatar TEXT,
      thumbnail TEXT,
      createdAt TEXT
    );
    
    CREATE TABLE IF NOT EXISTS food (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      author TEXT,
      time TEXT,
      calories TEXT,
      rating TEXT,
      img TEXT,
      height INTEGER,
      ingredients TEXT,
      steps TEXT
    );

    CREATE TABLE IF NOT EXISTS travel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      location TEXT,
      duration TEXT,
      img TEXT,
      text TEXT,
      itinerary TEXT,
      tips TEXT
    );

    CREATE TABLE IF NOT EXISTS photo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      author TEXT,
      avatar TEXT,
      likes INTEGER,
      views TEXT,
      url TEXT,
      width INTEGER,
      height INTEGER,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS reading (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      author TEXT,
      rating REAL,
      cover TEXT,
      tags TEXT,
      summary TEXT,
      review TEXT,
      quote TEXT
    );

    CREATE TABLE IF NOT EXISTS music (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      cover TEXT,
      creatorName TEXT,
      creatorAvatar TEXT,
      createDate TEXT,
      favCount TEXT,
      shareCount TEXT,
      commentCount TEXT,
      tags TEXT,
      desc TEXT,
      trackCount INTEGER,
      playCount INTEGER,
      songs TEXT
    );

    CREATE TABLE IF NOT EXISTS movie (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      rating REAL,
      year TEXT,
      director TEXT,
      genre TEXT,
      cover TEXT,
      desc TEXT,
      tags TEXT,
      rank INTEGER
    );

    CREATE TABLE IF NOT EXISTS sports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      type TEXT,
      distance TEXT,
      pace TEXT,
      hr TEXT,
      map TEXT,
      date TEXT,
      elevation TEXT,
      calories TEXT,
      description TEXT,
      splits TEXT
    );

    CREATE TABLE IF NOT EXISTS fashion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      brand TEXT,
      img TEXT,
      text TEXT,
      designer TEXT,
      collection TEXT,
      detailedReview TEXT,
      lookbook TEXT
    );
  `)

  // HELPER FUNCTION: Insert Data
  const insertData = (table, columns, dataArray) => {
    const placeholders = columns.map(() => '?').join(', ')
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
    const stmt = db.prepare(sql)
    for (const row of dataArray) {
      const values = columns.map(col => {
        let val = row[col]
        if (typeof val === 'object') return JSON.stringify(val)
        if (val === undefined || val === null) return ''
        return val
      })
      stmt.run(values)
    }
    stmt.free()
  }

  // --- GENERATE DATA ---
  
  insertData('article', ['id', 'title', 'category', 'summary', 'content', 'views', 'likes', 'tags', 'author_name', 'author_avatar', 'thumbnail', 'createdAt'], [])

  insertData('food', ['id', 'title', 'author', 'time', 'calories', 'rating', 'img', 'height', 'ingredients', 'steps'], [])

  insertData('travel', ['id', 'title', 'location', 'duration', 'img', 'text', 'itinerary', 'tips'], [])

  insertData('photo', ['id', 'title', 'author', 'avatar', 'likes', 'views', 'url', 'width', 'height', 'category'], [])

  insertData('reading', ['id', 'title', 'author', 'rating', 'cover', 'tags', 'summary', 'review', 'quote'], [])

  insertData('music', ['id', 'title', 'cover', 'creatorName', 'creatorAvatar', 'createDate', 'favCount', 'shareCount', 'commentCount', 'tags', 'desc', 'trackCount', 'playCount', 'songs'], [])

  insertData('movie', ['id', 'title', 'rating', 'year', 'director', 'genre', 'cover', 'desc', 'tags', 'rank'], [])

  insertData('sports', ['id', 'title', 'type', 'distance', 'pace', 'hr', 'map', 'date', 'elevation', 'calories', 'description', 'splits'], [])

  insertData('fashion', ['id', 'title', 'brand', 'img', 'text', 'designer', 'collection', 'detailedReview', 'lookbook'], [])


  // Save DB
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(path.join(__dirname, '../public/mock.sqlite'), buffer)
  console.log('Database saved successfully to public/mock.sqlite!')
}

generateDB().catch(console.error)
