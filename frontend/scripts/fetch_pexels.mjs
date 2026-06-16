import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_KEY = "BKrOhhWEKcv4nWMQR9NfmsrROJOgv7v0FHyv4KyVDZzDRUdqYgW5W70m"

// Search queries for each item - using English for better Pexels results
const queries = {
  food: {
    1: "tonkotsu ramen japanese", 2: "sweet sour pork chinese",
    3: "salmon sashimi japanese", 4: "sushi roll japanese",
    5: "mapo tofu sichuan", 6: "tiramisu dessert italian",
    7: "peking duck chinese roast", 8: "tom yum soup thai",
    9: "steak beef grilled", 10: "pho vietnamese noodle soup",
    11: "chocolate lava cake dessert", 12: "hainanese chicken rice",
    13: "bibimbap korean rice bowl", 14: "tempura japanese fried",
    15: "croissant french bakery", 16: "matcha cake green tea dessert",
    17: "roasted lamb chops", 18: "paella spanish seafood",
    19: "cheeseburger american", 20: "sichuan fish sour soup",
    21: "gelato ice cream dessert"
  },
  travel: {
    1: "tokyo japan city", 2: "paris france eiffel",
    3: "iceland waterfall nature", 4: "bali temple rice terrace",
    5: "new york city skyline", 6: "kyoto japan temple autumn",
    7: "santorini greece sunset", 8: "maldives water villa beach",
    9: "london uk big ben", 10: "switzerland alps mountain lake",
    11: "prague charles bridge", 12: "morocco marrakech market",
    13: "lijiang ancient town china", 14: "grand canyon arizona",
    15: "amsterdam canal netherlands", 16: "bangkok thailand temple",
    17: "new zealand lake mountain", 18: "venice italy canal gondola",
    19: "jiuzhaigou lake autumn china", 20: "cairo pyramid egypt"
  },
  reading: {
    1: "vintage book library", 2: "chinese literature book",
    3: "japanese novel book", 4: "little prince book rose",
    5: "science fiction book space", 6: "chinese classic novel book",
    7: "kite book afghanistan", 8: "1984 orwell book dystopia",
    9: "love novel book vintage", 10: "french novel book existential",
    11: "chinese ancient book", 12: "mockingbird book classic",
    13: "gatsby book jazz age", 14: "moon book art novel",
    15: "japanese literature book", 16: "japanese mystery novel",
    17: "japanese bookstore novel", 18: "alchemist book adventure",
    19: "chinese river town book", 20: "novel reading book sad"
  },
  music: {
    1: "post rock band concert", 2: "graduation celebration music",
    3: "running jogging fitness music", 4: "jazz cafe saxophone piano",
    5: "country music guitar road", 6: "piano night music sheet",
    7: "electronic music dj nightclub", 8: "soul rnb vinyl record",
    9: "kpop concert stage dance", 10: "retro cassette music chinese",
    11: "jazz saxophone cafe sunday", 12: "country folk guitar music",
    13: "lofi hip hop study desk", 14: "rock guitar concert stage",
    15: "meditation yoga nature zen", 16: "marathon runner fitness music",
    17: "campfire acoustic guitar folk", 18: "orchestra classical concert hall",
    19: "beach ukulele tropical music", 20: "chinese rock band concert"
  },
  photo: {
    1: "street cobbler craftsman old", 2: "skyscraper cityscape shanghai",
    3: "tibet prayer flag mountain", 4: "rain alley reflection wet",
    5: "tokyo neon night shinjuku", 6: "sahara desert milky way stars",
    7: "water town canal morning fog", 8: "iceland black sand beach",
    9: "kyoto maple autumn temple garden", 10: "subway train portrait black white",
    11: "aurora northern lights sky", 12: "desert camel sand dune",
    13: "paris boutique window fashion", 14: "rice terrace fog morning",
    15: "venice carnival mask", 16: "shibuya crossing crowd tokyo",
    17: "blue hole ocean diving", 18: "autumn lake colorful forest",
    19: "pottery ceramic wheel hands", 20: "sydney opera house harbour"
  },
  sports: {
    1: "running lake morning jogging", 2: "marathon finish line runner",
    3: "trail running mountain forest", 4: "night running city river",
    5: "trail mountain hiking", 6: "night run city lights",
    7: "cycling road bike hill", 8: "swimming pool lap water",
    9: "yoga morning stretch mat", 10: "hiit gym workout training",
    11: "rock climbing bouldering indoor", 12: "jump rope exercise skipping",
    13: "plank exercise core abs", 14: "badminton racket shuttlecock",
    15: "skiing snow mountain winter", 16: "basketball court hoop game",
    17: "plank fitness exercise", 18: "badminton sport game",
    19: "ski snow resort winter", 20: "basketball game player"
  },
  fashion: {
    1: "minimal fashion wardrobe capsule", 2: "yohji yamamoto black fashion",
    3: "blue fashion runway model", 4: "sneakers shoes street fashion",
    5: "minimal closet wardrobe fashion", 6: "harajuku tokyo street fashion",
    7: "minimal capsule wardrobe", 8: "tokyo street style fashion japan",
    9: "french parisian style fashion", 10: "autumn winter layering fashion",
    11: "handbag leather bag fashion", 12: "thrift vintage secondhand fashion",
    13: "wedding guest dress elegant", 14: "gold silver jewelry accessories",
    15: "menswear business suit fashion", 16: "floral print dress fashion",
    17: "business office workwear fashion", 18: "beach bikini summer fashion",
    19: "wool sweater knit winter", 20: "white sneakers shoes streetwear"
  }
}

const cache = {}
async function searchPexels(query) {
  if (cache[query] !== undefined) return cache[query]
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(query)
    const req = https.get(`https://api.pexels.com/v1/search?query=${encoded}&per_page=1&locale=zh-CN`, {
      headers: { 'Authorization': API_KEY },
      timeout: 10000
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.photos && json.photos.length > 0) {
            cache[query] = json.photos[0].src.medium
          } else {
            cache[query] = null
          }
        } catch { cache[query] = null }
        resolve(cache[query])
      })
    })
    req.on('error', () => { cache[query] = null; resolve(null) })
    req.on('timeout', () => { req.destroy(); cache[query] = null; resolve(null) })
  })
}

// Load database
const dbBuffer = fs.readFileSync(path.join(__dirname, '../public/mock.sqlite'))
const SQL = await initSqlJs()
const db = new SQL.Database(dbBuffer)

const tableColMap = {
  food: 'img', travel: 'img', reading: 'cover', music: 'cover',
  photo: 'url', sports: 'map', fashion: 'img'
}

let totalOk = 0, totalFail = 0

for (const [table, items] of Object.entries(queries)) {
  const col = tableColMap[table]
  let ok = 0, fail = 0
  for (const [id, query] of Object.entries(items)) {
    const url = await searchPexels(query)
    if (url) {
      db.prepare(`UPDATE ${table} SET ${col} = ? WHERE id = ?`).run([url, parseInt(id)])
      ok++
    } else {
      fail++
      console.log(`  FAIL [${table}:${id}] ${query}`)
    }
    await new Promise(r => setTimeout(r, 250)) // rate limit
  }
  console.log(`${table}: ${ok}/${ok+fail} ok`)
  totalOk += ok; totalFail += fail
}

console.log(`\nTotal: ${totalOk} ok, ${totalFail} fail`)
fs.writeFileSync(path.join(__dirname, '../public/mock.sqlite'), Buffer.from(db.export()))
console.log('Database saved!')
db.close()
