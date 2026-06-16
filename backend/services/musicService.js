const db = require('../config/db');
const api = require('NeteaseCloudMusicApi');

/**
 * Search songs on NetEase Cloud Music
 */
exports.searchSongs = async (keyword, limit = 10) => {
  try {
    const result = await api.cloudsearch({ keywords: keyword, type: 1, limit });
    const songs = result.body?.result?.songs || [];
    return songs.map(s => ({
      neteaseId: s.id,
      name: s.name,
      artist: (s.ar || []).map(a => a.name).join(' / '),
      album: s.al?.name || '',
      duration: s.dt || 0,
      coverUrl: s.al?.picUrl || '',
    }));
  } catch (err) {
    console.error('[MusicService] Search error:', err.message);
    return [];
  }
};

/**
 * Get playable audio URL from NetEase
 */
exports.getSongUrl = async (neteaseId) => {
  try {
    const result = await api.song_url_v1({ id: String(neteaseId), level: 'standard' });
    const data = result.body?.data?.[0];
    return data?.url || null;
  } catch (err) {
    console.error('[MusicService] Get URL error:', err.message);
    return null;
  }
};

/**
 * Save a song to the database (or update if exists)
 */
exports.saveSong = async (songData) => {
  const { neteaseId, name, artist, album, duration, coverUrl, audioUrl } = songData;
  try {
    const [existing] = await db.query('SELECT * FROM songs WHERE netease_id = ?', [neteaseId]);
    if (existing.length > 0) {
      // Update audio URL (it expires periodically)
      if (audioUrl) {
        await db.query(
          'UPDATE songs SET audio_url = ?, cover_url = COALESCE(NULLIF(?, \'\'), cover_url), updated_at = NOW() WHERE netease_id = ?',
          [audioUrl, coverUrl, neteaseId]
        );
      }
      return existing[0];
    }
    const [result] = await db.query(
      'INSERT INTO songs (netease_id, name, artist, album, duration, cover_url, audio_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [neteaseId, name, artist, album, duration, coverUrl, audioUrl]
    );
    return { id: result.insertId, neteaseId, name, artist, album, duration, coverUrl, audioUrl };
  } catch (err) {
    console.error('[MusicService] Save error:', err.message);
    throw err;
  }
};

/**
 * Score how well a search result matches the keyword
 */
function matchScore(song, keyword) {
  const clean = (s) => (s || '').toLowerCase().replace(/[\(\)\[\]（）\s\-_/·\.\,\!\?\&\:\;\"\'\`\~\@\#\$\%\^\*\+\=\|\\\{\}\<\>]+/g, '');
  const songName = clean(song.name);
  const kw = clean(keyword);

  if (songName === kw) return 100;          // exact match
  if (songName.includes(kw)) return 80;     // song name contains keyword
  if (kw.includes(songName)) return 60;     // keyword contains song name

  // Partial word matching
  const songWords = songName.split('');
  const kwWords = kw.split('');
  let matches = 0;
  for (const w of kwWords) {
    if (w.length > 1 && songWords.some(sw => sw.includes(w) || w.includes(sw))) matches++;
  }
  return matches * 5;
}

/**
 * Search song, get its URL, and save to DB — all in one call
 */
exports.searchAndSave = async (keyword) => {
  const searched = await exports.searchSongs(keyword, 8);
  if (searched.length === 0) return null;

  // Score and pick best match (tiebreaker: prefer longer duration = more likely original)
  let best = searched[0];
  let bestScore = matchScore(best, keyword);
  for (let i = 1; i < searched.length; i++) {
    const score = matchScore(searched[i], keyword);
    const dur = searched[i].duration || 0;
    const bestDur = best.duration || 0;
    // Break ties by preferring longer duration (covers are often shorter)
    const effectiveScore = score === bestScore ? (dur > bestDur ? score + 0.5 : score) : score;
    if (effectiveScore > bestScore || (effectiveScore === bestScore && dur > bestDur)) {
      bestScore = score;
      best = searched[i];
    }
  }
  console.log(`[MusicService] Best match for "${keyword}": "${best.name}" by "${best.artist}" score=${bestScore}`);

  const audioUrl = await exports.getSongUrl(best.neteaseId);

  return exports.saveSong({
    neteaseId: best.neteaseId,
    name: best.name,
    artist: best.artist,
    album: best.album,
    duration: best.duration,
    coverUrl: best.coverUrl,
    audioUrl,
  });
};

/**
 * Get saved songs from DB
 */
exports.getSavedSongs = async (page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    const [rows] = await db.query('SELECT * FROM songs ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM songs');
    return { items: rows, total };
  } catch (err) {
    console.error('[MusicService] Get saved error:', err.message);
    return { items: [], total: 0 };
  }
};

/**
 * Refresh audio URL for a saved song
 */
exports.refreshSongUrl = async (neteaseId) => {
  const audioUrl = await exports.getSongUrl(neteaseId);
  if (audioUrl) {
    await db.query('UPDATE songs SET audio_url = ?, updated_at = NOW() WHERE netease_id = ?', [audioUrl, neteaseId]);
  }
  return audioUrl;
};
