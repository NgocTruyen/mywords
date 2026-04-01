// ===================== API Client =====================
const api = {
  async saveEntry(date, content, keystrokeTimestamps = []) {
    const response = await fetch('/api/journal/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, content, keystrokeTimestamps }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },

  async getEntry(date) {
    const response = await fetch(`/api/journal/entries/${date}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },

  async getAllEntries() {
    const response = await fetch('/api/journal/entries');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },

  async getEntriesByMonth(year, month) {
    const response = await fetch(`/api/journal/entries/${year}/${String(month).padStart(2, '0')}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },

  async getStreak() {
    const response = await fetch('/api/journal/streak');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },

  async getStats() {
    const response = await fetch('/api/journal/stats');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },
};

// ===================== Configuration =====================
const TODAY = new Date().toISOString().slice(0, 10);
const PAUSE_THRESHOLD_MS = 2000;
let editingDate = TODAY;
let keystrokeTimestamps = [];
let isViewingMode = false;

// ===================== DOM Elements =====================
const textarea = document.getElementById('journalEntry');
const dateInput = document.getElementById('entryDate');
const wordCounterDisplay = document.getElementById('wordCounterDisplay');
const goalStatusSpan = document.getElementById('goalStatus');
const streakDisplay = document.getElementById('streakDisplay');
const badgesContainer = document.getElementById('badgesContainer');
const statWordsSpan = document.getElementById('statWords');
const statMoodSpan = document.getElementById('statMood');
const statTimeSpan = document.getElementById('statTime');
const statPausesSpan = document.getElementById('statPauses');
const saveStatusSpan = document.getElementById('saveStatus');
const journalForm = document.getElementById('journalForm');
const journalList = document.getElementById('journalList');
const saveBtn = document.getElementById('saveBtn');
const backToTodayBtn = document.getElementById('backToTodayBtn');
const darkToggle = document.getElementById('darkModeToggle');
const statsPanel = document.getElementById('statsPanel');
const statsToggleMobile = document.getElementById('statsToggleMobile');
const calendarToggleMobile = document.getElementById('calendarToggleMobile');

let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth();

// ===================== Dark Mode =====================
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
}

darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
});

// ===================== Toggle Buttons for Mobile =====================
statsToggleMobile.addEventListener('click', (e) => {
  e.stopPropagation();
  statsPanel.classList.toggle('active');
});

calendarToggleMobile.addEventListener('click', (e) => {
  e.stopPropagation();
  statsPanel.classList.toggle('active');
});

// ===================== Date Formatting =====================
function formatDate(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();
  const year = date.getFullYear();

  let suffix = 'th';
  if (dayNum === 1 || dayNum === 21 || dayNum === 31) suffix = 'st';
  else if (dayNum === 2 || dayNum === 22) suffix = 'nd';
  else if (dayNum === 3 || dayNum === 23) suffix = 'rd';

  return `${dayName}, ${monthName} ${dayNum}${suffix}, ${year}`;
}

function updateDateDisplay() {
  const date = new Date(dateInput.value + 'T00:00:00');
  document.getElementById('todayDate').textContent = formatDate(date);
}

// ===================== Word Counter & Stats =====================
function updateWordCounter(wc) {
  wordCounterDisplay.innerText = `${wc} / 750 từ`;
  if (wc >= 750) {
    goalStatusSpan.innerText = '🎉 Đã đạt 750 từ!';
    goalStatusSpan.style.color = '#4caf50';
  } else {
    goalStatusSpan.innerText = `${750 - wc} từ nữa`;
    goalStatusSpan.style.color = 'var(--text-light)';
  }
}

function countWords(text) {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function updateStatsPanel(entryData) {
  statWordsSpan.innerText = entryData.word_count || 0;
  statMoodSpan.innerText = entryData.mood_label || '😐 Trung tính';
  statTimeSpan.innerText = `${entryData.writing_time_sec || 0} giây`;
  statPausesSpan.innerText = entryData.pause_count || 0;
}

// ===================== Save Entry =====================
async function saveEntry() {
  const content = textarea.value.trim();
  const wc = countWords(content);

  if (wc === 0) {
    saveStatusSpan.innerHTML = '⚠️ Vui lòng viết gì đó trước khi lưu';
    return;
  }

  saveStatusSpan.innerHTML = '⏳ Đang lưu...';

  try {
    const result = await api.saveEntry(editingDate, content, keystrokeTimestamps);
    saveStatusSpan.innerHTML = '✅ Đã lưu!';
    keystrokeTimestamps = [];

    if (editingDate === TODAY) {
      await updateStats();
      await renderCalendar();
    }

    await loadJournalList();

    setTimeout(() => {
      saveStatusSpan.innerHTML = editingDate === TODAY ? '📝 Bài viết hôm nay' : '📖 Xem nhật ký';
    }, 2000);
  } catch (error) {
    console.error('Save error:', error);
    saveStatusSpan.innerHTML = '❌ Lỗi khi lưu';
  }
}

// ===================== Load & Display =====================
async function loadToday() {
  try {
    editingDate = TODAY;
    isViewingMode = false;
    keystrokeTimestamps = [];
    dateInput.value = TODAY;
    updateDateDisplay();

    const entry = await api.getEntry(TODAY);

    if (entry) {
      textarea.value = entry.content || '';
      updateWordCounter(countWords(textarea.value));
      updateStatsPanel(entry);
    } else {
      textarea.value = '';
      updateWordCounter(0);
      updateStatsPanel({ word_count: 0, mood_label: '😐 Trung tính', writing_time_sec: 0, pause_count: 0 });
    }

    textarea.disabled = false;
    textarea.style.opacity = '1';
    textarea.style.pointerEvents = 'auto';
    saveStatusSpan.innerHTML = '📝 Bài viết hôm nay';
    saveBtn.style.display = 'inline-block';
    backToTodayBtn.style.display = 'none';

    await updateStats();
    await renderCalendar();
  } catch (error) {
    console.error('Load today error:', error);
  }
}

async function loadOldEntry(date) {
  try {
    const entry = await api.getEntry(date);
    if (!entry) {
      alert('Không tìm thấy bài viết cho ngày ' + date);
      return;
    }

    editingDate = date;
    isViewingMode = true;
    keystrokeTimestamps = [];
    dateInput.value = date;
    updateDateDisplay();

    textarea.value = entry.content || '';
    updateWordCounter(countWords(textarea.value));
    updateStatsPanel(entry);

    textarea.disabled = true;
    textarea.style.opacity = '0.7';
    textarea.style.pointerEvents = 'none';
    saveStatusSpan.innerHTML = `📖 Xem ngày ${date}`;
    saveBtn.style.display = 'none';
    backToTodayBtn.style.display = 'inline-block';

    closeModal();
  } catch (error) {
    console.error('Load error:', error);
  }
}

async function loadJournalList() {
  try {
    const entries = await api.getAllEntries();
    journalList.innerHTML = '';

    if (entries.length === 0) {
      journalList.innerHTML = '<div class="no-entries">Chưa có bài viết nào. Bắt đầu viết ngay!</div>';
      return;
    }

    entries.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'entry-item';
      div.onclick = () => viewEntry(entry.date);
      div.innerHTML = `
        <div class="entry-date">${entry.date}</div>
        <div class="entry-sentiment">${entry.mood_label || '😐'} · ${entry.word_count || 0} từ</div>
        <div class="entry-content">${escapeHtml(entry.content).slice(0, 200)}...</div>
      `;
      journalList.appendChild(div);
    });
  } catch (error) {
    console.error('Load list error:', error);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===================== Stats & Badges =====================
async function updateStats() {
  try {
    const allEntries = await api.getAllEntries();
    const streak = await api.getStreak();

    streakDisplay.innerText = `🔥 ${streak.current_streak || 0} ngày`;

    // Update badges
    const badges = new Set();
    if (allEntries.length > 0) badges.add('first_entry');
    if (allEntries.length >= 7) badges.add('streak_7');
    if (allEntries.length >= 30) badges.add('streak_30');
    if (allEntries.some(e => e.word_count >= 750)) badges.add('first_750');
    if (countWords(textarea.value) >= 750) badges.add('today_750');

    const badgeDefs = [
      { id: 'first_entry', label: '🌟 Bài viết đầu tiên' },
      { id: 'streak_7', label: '📆 7 ngày liên tiếp' },
      { id: 'streak_30', label: '🏆 30 ngày liên tiếp' },
      { id: 'first_750', label: '✨ Đạt 750 từ' },
      { id: 'today_750', label: '🎯 750 từ hôm nay' },
    ];

    badgesContainer.innerHTML = badgeDefs.map(b => {
      const earned = badges.has(b.id);
      return `<div class="badge ${earned ? 'earned' : ''}">${b.label} ${earned ? '✓' : '🔒'}</div>`;
    }).join('');
  } catch (error) {
    console.error('Update stats error:', error);
  }
}

// ===================== Calendar =====================
function getMoodIcon(moodLabel) {
  if (!moodLabel) return '😐';
  if (moodLabel.includes('Tích cực')) return '😊';
  if (moodLabel.includes('Tiêu cực')) return '😞';
  return '😐';
}

async function renderCalendar() {
  try {
    const year = currentCalendarYear;
    const month = currentCalendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    document.getElementById('monthYearDisplay').innerText = `${monthNames[month]} ${year}`;

    const monthEntries = await api.getEntriesByMonth(year, month + 1);
    const entriesByDate = {};
    monthEntries.forEach(e => {
      entriesByDate[e.date] = e;
    });

    let gridHtml = '';
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    weekdays.forEach(w => gridHtml += `<div class="weekday">${w}</div>`);

    let dayCounter = 1;
    for (let i = 0; i < 42; i++) {
      if (i < firstDay || dayCounter > daysInMonth) {
        gridHtml += `<div class="cal-day empty"></div>`;
        continue;
      }

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
      const hasEntry = !!entriesByDate[dateStr];
      const moodIcon = hasEntry ? getMoodIcon(entriesByDate[dateStr].mood_label) : '';

      gridHtml += `<div class="cal-day ${hasEntry ? 'has-entry' : ''}" onclick="viewEntry('${dateStr}')" title="${hasEntry ? entriesByDate[dateStr].mood_label : 'Không có bài viết'}" style="cursor: ${hasEntry ? 'pointer' : 'default'}">
        <div style="font-size: 0.7rem;">${moodIcon}</div>
        <div>${dayCounter}</div>
      </div>`;
      dayCounter++;
    }

    document.getElementById('calendarGrid').innerHTML = gridHtml;
  } catch (error) {
    console.error('Calendar error:', error);
  }
}

function prevMonth() {
  if (currentCalendarMonth === 0) {
    currentCalendarMonth = 11;
    currentCalendarYear--;
  } else {
    currentCalendarMonth--;
  }
  renderCalendar();
}

function nextMonth() {
  if (currentCalendarMonth === 11) {
    currentCalendarMonth = 0;
    currentCalendarYear++;
  } else {
    currentCalendarMonth++;
  }
  renderCalendar();
}

// ===================== Modal =====================
async function viewEntry(date) {
  const entry = await api.getEntry(date);
  if (!entry) {
    alert('Không tìm thấy bài viết cho ngày ' + date);
    return;
  }

  const modal = document.getElementById('entryModal');
  document.getElementById('modalDateTitle').innerText = `📅 ${date}`;
  document.getElementById('modalContent').innerText = entry.content || '(Không có nội dung)';
  document.getElementById('modalStats').innerHTML = `
    <div>📊 Số từ: <strong>${entry.word_count || 0}</strong></div>
    <div>😊 Tâm trạng: <strong>${entry.mood_label || '😐'}</strong></div>
    <div>⏱️ Thời gian: <strong>${entry.writing_time_sec || 0} giây</strong></div>
    <div>⏸️ Tạm dừng: <strong>${entry.pause_count || 0} lần</strong></div>
  `;

  document.getElementById('editEntryBtn').onclick = () => loadOldEntry(date);

  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('entryModal').style.display = 'none';
}

// ===================== Event Listeners =====================
textarea.addEventListener('input', () => {
  if (isViewingMode) return;

  keystrokeTimestamps.push(Date.now());
  const wc = countWords(textarea.value);
  updateWordCounter(wc);

  if (wc >= 750) {
    goalStatusSpan.innerText = '🎉 Đã đạt 750 từ!';
  } else {
    goalStatusSpan.innerText = `${750 - wc} từ nữa`;
  }
});

journalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  saveEntry();
});

saveBtn.addEventListener('click', saveEntry);
backToTodayBtn.addEventListener('click', loadToday);
dateInput.addEventListener('change', () => {
  const newDate = dateInput.value;
  if (newDate) loadOldEntry(newDate);
});

document.getElementById('prevMonthBtn').addEventListener('click', prevMonth);
document.getElementById('nextMonthBtn').addEventListener('click', nextMonth);
document.querySelector('.close-modal').addEventListener('click', closeModal);
document.getElementById('entryModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('entryModal')) closeModal();
});

// ===================== Initialize =====================
async function init() {
  try {
    console.log('🚀 Initializing MyWords...');
    dateInput.valueAsDate = new Date(TODAY);
    updateDateDisplay();
    await loadToday();
    await loadJournalList();
    console.log('✅ Ready!');
  } catch (error) {
    console.error('Init error:', error);
  }
}

init();
