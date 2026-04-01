import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import config from '../../config/config.js';
import fs from 'fs';
import path from 'path';

let db = null;

export async function initDatabase() {
  if (db) return db;

  // Create data directory if not exists
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }

  db = await open({
    filename: config.dbPath,
    driver: sqlite3.Database,
  });

  await db.exec('PRAGMA foreign_keys = ON');

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      content TEXT DEFAULT '',
      word_count INTEGER DEFAULT 0,
      mood_label TEXT DEFAULT '😐 Trung tính',
      sentiment_score INTEGER DEFAULT 0,
      writing_time_sec INTEGER DEFAULT 0,
      pause_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_entry_date TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
    CREATE INDEX IF NOT EXISTS idx_entries_created ON entries(created_at);
  `);

  return db;
}

export async function getDatabase() {
  if (!db) db = await initDatabase();
  return db;
}

export async function saveEntry(date, content, stats) {
  const database = await getDatabase();
  const now = new Date().toISOString();

  await database.run(
    `INSERT INTO entries (date, content, word_count, mood_label, sentiment_score, writing_time_sec, pause_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       content = excluded.content,
       word_count = excluded.word_count,
       mood_label = excluded.mood_label,
       sentiment_score = excluded.sentiment_score,
       writing_time_sec = excluded.writing_time_sec,
       pause_count = excluded.pause_count,
       updated_at = ?`,
    [date, content, stats.wordCount || 0, stats.moodLabel || '😐 Trung tính',
     stats.sentimentScore || 0, stats.writingTimeSec || 0, stats.pauseCount || 0, now, now, now]
  );
}

export async function getEntry(date) {
  const database = await getDatabase();
  return await database.get('SELECT * FROM entries WHERE date = ?', [date]);
}

export async function getAllEntries() {
  const database = await getDatabase();
  return await database.all('SELECT * FROM entries ORDER BY date DESC') || [];
}

export async function getEntriesByMonth(year, month) {
  const database = await getDatabase();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  return await database.all(
    'SELECT * FROM entries WHERE date BETWEEN ? AND ? ORDER BY date DESC',
    [startDate, endDate]
  ) || [];
}

export async function getStreak() {
  const database = await getDatabase();
  return await database.get('SELECT * FROM streaks LIMIT 1');
}

export async function updateStreak(currentStreak, longestStreak, lastEntryDate) {
  const database = await getDatabase();
  const now = new Date().toISOString();

  // Get existing streak
  const existing = await database.get('SELECT * FROM streaks LIMIT 1');

  if (existing) {
    await database.run(
      `UPDATE streaks SET current_streak = ?, longest_streak = ?, last_entry_date = ?, updated_at = ? WHERE id = ?`,
      [currentStreak, longestStreak, lastEntryDate, now, existing.id]
    );
  } else {
    await database.run(
      `INSERT INTO streaks (current_streak, longest_streak, last_entry_date, updated_at) VALUES (?, ?, ?, ?)`,
      [currentStreak, longestStreak, lastEntryDate, now]
    );
  }
}

export async function close() {
  if (db) {
    await db.close();
    db = null;
  }
}

export default { initDatabase, getDatabase, saveEntry, getEntry, getAllEntries, getEntriesByMonth, getStreak, updateStreak, close };
