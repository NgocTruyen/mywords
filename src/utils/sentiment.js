// Sentiment Analysis Utility - Vietnamese & English support
const positiveWords = new Set([
  'vui', 'hạnh phúc', 'yêu', 'tuyệt', 'tốt', 'đẹp', 'cảm ơn', 'thích', 'háo hức', 'bình yên', 'hài lòng',
  'tuyệt vời', 'thú vị', 'thành công', 'tự hào',
  'happy', 'love', 'great', 'good', 'wonderful', 'amazing', 'beautiful', 'excited', 'peaceful', 'grateful', 'joy', 'awesome',
]);

const negativeWords = new Set([
  'buồn', 'chán', 'mệt', 'khó chịu', 'tức giận', 'thất vọng', 'lo lắng', 'sợ', 'đau', 'cô đơn', 'xấu', 'khó',
  'tồi tệ', 'thất bại', 'lo sợ',
  'sad', 'angry', 'tired', 'disappointed', 'anxious', 'scared', 'lonely', 'bad', 'hard', 'pain', 'hate', 'depressed',
]);

export function analyzeSentiment(text) {
  if (!text || !text.trim()) return { mood: '😐 Trung tính', score: 0 };

  const lower = text.toLowerCase();
  let posCount = 0, negCount = 0;

  for (let word of positiveWords) if (lower.includes(word)) posCount++;
  for (let word of negativeWords) if (lower.includes(word)) negCount++;

  if (posCount > negCount) return { mood: '😊 Tích cực', score: 1 };
  if (negCount > posCount) return { mood: '😞 Tiêu cực', score: -1 };
  return { mood: '😐 Trung tính', score: 0 };
}

export function countWords(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function computeTypingStats(keystrokeTimestamps, pauseThresholdMs = 2000) {
  if (!keystrokeTimestamps || keystrokeTimestamps.length === 0) {
    return { activeTimeSec: 0, pauseCount: 0 };
  }

  const sorted = [...keystrokeTimestamps].sort((a, b) => a - b);
  let activeMs = 0, pauses = 0;

  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i] - sorted[i - 1];
    if (diff <= pauseThresholdMs) activeMs += diff;
    else pauses++;
  }

  return { activeTimeSec: Math.floor(activeMs / 1000), pauseCount: pauses };
}

export default { analyzeSentiment, countWords, computeTypingStats };
