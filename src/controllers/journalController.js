import * as Journal from '../models/Journal.js';
import { analyzeSentiment, countWords, computeTypingStats } from '../utils/sentiment.js';

export async function saveEntry(req, res, next) {
  try {
    const { date, content, keystrokeTimestamps } = req.body;

    if (!date || !content) {
      return res.status(400).json({ error: 'Missing date or content' });
    }

    const wordCount = countWords(content);
    const sentiment = analyzeSentiment(content);
    const typingStats = computeTypingStats(keystrokeTimestamps || []);

    const stats = {
      wordCount,
      moodLabel: sentiment.mood,
      sentimentScore: sentiment.score,
      writingTimeSec: typingStats.activeTimeSec,
      pauseCount: typingStats.pauseCount,
    };

    await Journal.saveEntry(date, content, stats);

    // Update streak
    const allEntries = await Journal.getAllEntries();
    const streakCount = allEntries.length;
    await Journal.updateStreak(streakCount, streakCount, date);

    res.json({ success: true, date, stats });
  } catch (error) {
    next(error);
  }
}

export async function getEntry(req, res, next) {
  try {
    const { date } = req.params;
    if (!date) return res.status(400).json({ error: 'Missing date' });

    const entry = await Journal.getEntry(date);
    if (!entry) return res.status(404).json({ error: 'Not found' });

    res.json(entry);
  } catch (error) {
    next(error);
  }
}

export async function getAllEntries(req, res, next) {
  try {
    const entries = await Journal.getAllEntries();
    res.json(entries);
  } catch (error) {
    next(error);
  }
}

export async function getEntriesByMonth(req, res, next) {
  try {
    const { year, month } = req.params;
    if (!year || !month) return res.status(400).json({ error: 'Missing year or month' });

    const entries = await Journal.getEntriesByMonth(parseInt(year), parseInt(month));
    res.json(entries);
  } catch (error) {
    next(error);
  }
}

export async function getStreak(req, res, next) {
  try {
    const streak = await Journal.getStreak();
    res.json(streak || { current_streak: 0, longest_streak: 0 });
  } catch (error) {
    next(error);
  }
}

export async function getStats(req, res, next) {
  try {
    const entries = await Journal.getAllEntries();
    const streak = await Journal.getStreak();

    const totalWords = entries.reduce((sum, e) => sum + (e.word_count || 0), 0);
    const avgMood = calculateAverageMood(entries);

    res.json({
      totalEntries: entries.length,
      totalWords,
      currentStreak: streak?.current_streak || 0,
      longestStreak: streak?.longest_streak || 0,
      averageMood: avgMood,
      wordsPerDay: entries.length ? Math.round(totalWords / entries.length) : 0,
    });
  } catch (error) {
    next(error);
  }
}

function calculateAverageMood(entries) {
  if (entries.length === 0) return '😐 Trung tính';
  const avgScore = entries.reduce((sum, e) => sum + (e.sentiment_score || 0), 0) / entries.length;
  if (avgScore > 0.2) return '😊 Tích cực';
  if (avgScore < -0.2) return '😞 Tiêu cực';
  return '😐 Trung tính';
}

export default { saveEntry, getEntry, getAllEntries, getEntriesByMonth, getStreak, getStats };
