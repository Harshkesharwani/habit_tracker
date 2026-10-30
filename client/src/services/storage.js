// src/services/storage.js
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

const STORAGE_KEYS = {
  USER: 'ht_user',
  HABITS: 'ht_habits',
  COMPLETIONS: 'ht_completions',
  LABELS: 'ht_labels',
  TRASH: 'ht_trash',
  MOOD: 'ht_mood',
  CHALLENGES: 'ht_challenges',
  POMODORO: 'ht_pomodoro',
};

export const CATEGORIES = [
  'General',
  'Health & Fitness',
  'Career & Work',
  'Learning',
  'Mindfulness',
  'Personal',
  'Finance',
];

const DEFAULT_USER = {
  id: 'user-001',
  name: 'Tanay Pratap',
  email: 'tanay@example.com',
  avatar: 'TP',
  joinedDate: '2026-01-15',
};

const DEFAULT_LABELS = [
  { id: 'lbl-1', name: 'Label 1', color: '#6366f1' },
  { id: 'lbl-2', name: 'Label 2', color: '#ec4899' },
  { id: 'lbl-3', name: 'Health & Fitness', color: '#10b981' },
  { id: 'lbl-4', name: 'Productivity', color: '#f59e0b' },
];

const DEFAULT_HABITS = [
  {
    id: 'habit-1',
    name: 'Task #1 - Read Books',
    description: 'Read 20 pages of a book every morning',
    startDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), -20), 'yyyy-MM-dd'),
    goal: 2,
    repeat: 'Daily',
    color: 'blue',
    category: 'Learning',
    status: 'Active', // 'Active' | 'Archived'
    labels: ['Label 1', 'Productivity'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-2',
    name: 'Task #2 - Morning Jog',
    description: 'Go for a 30-minute jog in the park',
    startDate: format(subDays(new Date(), 8), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), -15), 'yyyy-MM-dd'),
    goal: 2,
    repeat: 'Daily',
    color: 'pink',
    category: 'Health & Fitness',
    status: 'Active',
    labels: ['Label 2', 'Health & Fitness'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-3',
    name: 'Task #3 - Deep Work Focus',
    description: 'Work without phone notifications for 2 hours',
    startDate: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), -25), 'yyyy-MM-dd'),
    goal: 2,
    repeat: 'Daily',
    color: 'yellow',
    category: 'Career & Work',
    status: 'Active',
    labels: ['Label 1', 'Productivity'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-4',
    name: 'Task #4 - Drink 3L Water',
    description: 'Stay hydrated throughout the day',
    startDate: format(subDays(new Date(), 14), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), -10), 'yyyy-MM-dd'),
    goal: 2,
    repeat: 'Daily',
    color: 'green',
    category: 'Health & Fitness',
    status: 'Active',
    labels: ['Health & Fitness'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-12',
    name: 'Task #12 - Meditation & Mindfulness',
    description: '10 minutes guided breathing',
    startDate: format(subDays(new Date(), 20), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), -5), 'yyyy-MM-dd'),
    goal: 2,
    repeat: 'Daily',
    color: 'pink',
    category: 'Mindfulness',
    status: 'Active',
    labels: ['Label 1', 'Label 2'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-archived-1',
    name: 'Task #1 - Old Fitness Routine',
    description: 'Archive after completing the 30-day challenge',
    startDate: '2026-05-26',
    endDate: '2026-06-27',
    goal: 2,
    repeat: 'Once',
    color: 'blue',
    category: 'Health & Fitness',
    status: 'Archived',
    labels: ['Label 1'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-archived-2',
    name: 'Task #2 - Spanish Vocabulary',
    description: 'Weekly practice on Duolingo',
    startDate: '2026-05-26',
    endDate: '2026-06-27',
    goal: 2,
    repeat: 'Weekly',
    color: 'pink',
    category: 'Learning',
    status: 'Archived',
    labels: ['Label 2'],
    createdAt: new Date().toISOString(),
  },
];

// Seed initial completions for today and recent days
const todayStr = format(new Date(), 'yyyy-MM-dd');
const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

const DEFAULT_COMPLETIONS = [
  // Task #12 has 2 completions today (fully completed)
  { id: 'c-1', habitId: 'habit-12', date: todayStr, count: 2 },
  // Task #1 has 1 completion today (partial)
  { id: 'c-2', habitId: 'habit-1', date: todayStr, count: 1 },
  // Yesterday's completions
  { id: 'c-3', habitId: 'habit-1', date: yesterdayStr, count: 2 },
  { id: 'c-4', habitId: 'habit-2', date: yesterdayStr, count: 2 },
  { id: 'c-5', habitId: 'habit-3', date: yesterdayStr, count: 2 },
  { id: 'c-6', habitId: 'habit-12', date: yesterdayStr, count: 2 },
];

export const QUOTES = [
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", category: "Perseverance" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant", category: "Habits" },
  { text: "Small habits don’t add up, they compound.", author: "James Clear", category: "Atomic Habits" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", category: "Systems" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", category: "Action" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", category: "Stoicism" },
  { text: "First forget inspiration. Habit is more dependable.", author: "Octavia Butler", category: "Consistency" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun", category: "Discipline" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso", category: "Action" },
  { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain", category: "Growth" },
  { text: "Discipline equals freedom.", author: "Jocko Willink", category: "Discipline" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu", category: "Wisdom" },
];

export const DEFAULT_CHALLENGES = [
  {
    id: 'ch-1',
    title: '30-Day Morning Mastery',
    description: 'Wake up 30 minutes earlier, drink 500ml water, and complete your morning priority task for 30 consecutive days.',
    category: 'Health & Fitness',
    durationDays: 30,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    isCompleted: false,
  },
  {
    id: 'ch-2',
    title: '21-Day Habit Loop Anchor',
    description: 'Anchor one core micro-habit right after your morning coffee or breakfast to wire lasting neuroplasticity.',
    category: 'Personal',
    durationDays: 21,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    isCompleted: false,
  },
  {
    id: 'ch-3',
    title: '7-Day Deep Focus Detox',
    description: 'Complete at least 2 Pomodoro focus sessions every day without opening social media.',
    category: 'Career & Work',
    durationDays: 7,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    isCompleted: false,
  },
];

function getFromStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage error', e);
  }
}

export function inferHabitCategory(habit) {
  if (!habit) return 'General';
  // 1. If explicit category already exists and isn't 'General', preserve it
  if (
    habit.category &&
    typeof habit.category === 'string' &&
    habit.category.trim() &&
    habit.category.trim().toLowerCase() !== 'general'
  ) {
    return habit.category.trim();
  }

  // 2. Check labels array for matches against CATEGORIES
  if (Array.isArray(habit.labels)) {
    for (const lbl of habit.labels) {
      if (typeof lbl === 'string') {
        const found = CATEGORIES.find((c) => c.toLowerCase() === lbl.trim().toLowerCase());
        if (found && found.toLowerCase() !== 'general') {
          return found;
        }
      }
    }
  }

  // 3. Check habit name keywords
  const name = (habit.name || '').toLowerCase();
  if (
    name.includes('read') ||
    name.includes('book') ||
    name.includes('study') ||
    name.includes('spanish') ||
    name.includes('learn') ||
    name.includes('course')
  ) {
    return 'Learning';
  }
  if (
    name.includes('jog') ||
    name.includes('run') ||
    name.includes('water') ||
    name.includes('fitness') ||
    name.includes('workout') ||
    name.includes('gym') ||
    name.includes('walk') ||
    name.includes('exercise')
  ) {
    return 'Health & Fitness';
  }
  if (
    name.includes('deep work') ||
    name.includes('focus') ||
    name.includes('work') ||
    name.includes('job') ||
    name.includes('code') ||
    name.includes('coding') ||
    name.includes('productiv')
  ) {
    return 'Career & Work';
  }
  if (
    name.includes('meditation') ||
    name.includes('mindful') ||
    name.includes('breathe') ||
    name.includes('breathing') ||
    name.includes('yoga') ||
    name.includes('sleep')
  ) {
    return 'Mindfulness';
  }
  if (
    name.includes('save') ||
    name.includes('budget') ||
    name.includes('invest') ||
    name.includes('expense') ||
    name.includes('money')
  ) {
    return 'Finance';
  }

  return habit.category || 'General';
}

export function matchesCategory(habit, selectedCategory) {
  if (!selectedCategory || selectedCategory === 'All') {
    return true;
  }
  if (!habit) return false;

  const target = selectedCategory.trim().toLowerCase();
  const habitCategory = (habit.category || '').trim().toLowerCase();

  // 1. Direct match on habit.category (case-insensitive)
  if (habitCategory && habitCategory === target) {
    return true;
  }

  // 2. Match in habit.labels array (case-insensitive)
  if (Array.isArray(habit.labels)) {
    const hasMatchingLabel = habit.labels.some(
      (lbl) => typeof lbl === 'string' && lbl.trim().toLowerCase() === target
    );
    if (hasMatchingLabel) return true;
  }

  // 3. Fallback to inferred category
  const inferred = inferHabitCategory(habit).toLowerCase();
  if (inferred === target) {
    return true;
  }

  // 4. If selectedCategory is 'General', also match habits with no specific area
  if (target === 'general') {
    return !habitCategory || habitCategory === 'general';
  }

  return false;
}

export function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.HABITS)) {
    setToStorage(STORAGE_KEYS.HABITS, DEFAULT_HABITS);
  } else {
    // Backfill missing categories for existing habits in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.HABITS) || '[]');
      let modified = false;
      const updated = stored.map((h) => {
        if (!h.category || h.category === 'General') {
          const cat = inferHabitCategory(h);
          if (cat && cat !== h.category) {
            modified = true;
            return { ...h, category: cat };
          }
        }
        return h;
      });
      if (modified) {
        setToStorage(STORAGE_KEYS.HABITS, updated);
      }
    } catch {
      // ignore
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMPLETIONS)) {
    setToStorage(STORAGE_KEYS.COMPLETIONS, DEFAULT_COMPLETIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.LABELS)) {
    setToStorage(STORAGE_KEYS.LABELS, DEFAULT_LABELS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRASH)) {
    setToStorage(STORAGE_KEYS.TRASH, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.MOOD)) {
    setToStorage(STORAGE_KEYS.MOOD, 4);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CHALLENGES)) {
    setToStorage(STORAGE_KEYS.CHALLENGES, DEFAULT_CHALLENGES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.POMODORO)) {
    setToStorage(STORAGE_KEYS.POMODORO, []);
  }
  // Users start unauthenticated; login or demo login seeds the user session
}

// User / Auth
export function getCurrentUser() {
  return getFromStorage(STORAGE_KEYS.USER, null);
}

export function loginUser(email, password) {
  const user = {
    id: 'user-001',
    name: email.split('@')[0].replace('.', ' ') || 'Tanay Pratap',
    email,
    avatar: email[0].toUpperCase(),
    joinedDate: '2026-01-15',
  };
  setToStorage(STORAGE_KEYS.USER, user);
  return user;
}

export function signupUser(firstName, lastName, email, password) {
  const user = {
    id: `user-${Date.now()}`,
    name: `${firstName} ${lastName}`,
    email,
    avatar: `${firstName[0] || 'U'}${lastName[0] || ''}`.toUpperCase(),
    joinedDate: format(new Date(), 'yyyy-MM-dd'),
  };
  setToStorage(STORAGE_KEYS.USER, user);
  return user;
}

export function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.USER);
}

// Habits
export function getHabits() {
  const habits = getFromStorage(STORAGE_KEYS.HABITS, []);
  return habits.map((h) => {
    if (!h.category || h.category === 'General') {
      const cat = inferHabitCategory(h);
      if (cat && cat !== 'General') {
        return { ...h, category: cat };
      }
    }
    return h;
  });
}

export function saveHabit(habitData) {
  const habits = getHabits();
  if (habitData.id) {
    // Update existing
    const updated = habits.map((h) => (h.id === habitData.id ? { ...h, ...habitData } : h));
    setToStorage(STORAGE_KEYS.HABITS, updated);
    return habitData;
  } else {
    // Create new
    const newHabit = {
      ...habitData,
      id: `habit-${Date.now()}`,
      status: habitData.status || 'Active',
      createdAt: new Date().toISOString(),
    };
    habits.unshift(newHabit);
    setToStorage(STORAGE_KEYS.HABITS, habits);
    return newHabit;
  }
}

export function archiveHabit(id) {
  const habits = getHabits();
  const updated = habits.map((h) => (h.id === id ? { ...h, status: 'Archived' } : h));
  setToStorage(STORAGE_KEYS.HABITS, updated);
}

export function unarchiveHabit(id) {
  const habits = getHabits();
  const updated = habits.map((h) => (h.id === id ? { ...h, status: 'Active' } : h));
  setToStorage(STORAGE_KEYS.HABITS, updated);
}

export function moveToTrash(id) {
  const habits = getHabits();
  const habitToTrash = habits.find((h) => h.id === id);
  if (habitToTrash) {
    const updatedHabits = habits.filter((h) => h.id !== id);
    setToStorage(STORAGE_KEYS.HABITS, updatedHabits);

    const trash = getFromStorage(STORAGE_KEYS.TRASH, []);
    trash.unshift({ ...habitToTrash, trashedAt: new Date().toISOString() });
    setToStorage(STORAGE_KEYS.TRASH, trash);
  }
}

// Trash
export function getTrash() {
  return getFromStorage(STORAGE_KEYS.TRASH, []);
}

export function restoreFromTrash(id) {
  const trash = getTrash();
  const item = trash.find((t) => t.id === id);
  if (item) {
    const updatedTrash = trash.filter((t) => t.id !== id);
    setToStorage(STORAGE_KEYS.TRASH, updatedTrash);

    const habits = getHabits();
    const { trashedAt, ...habit } = item;
    habits.unshift(habit);
    setToStorage(STORAGE_KEYS.HABITS, habits);
  }
}

export function deletePermanently(id) {
  const trash = getTrash();
  const updated = trash.filter((t) => t.id !== id);
  setToStorage(STORAGE_KEYS.TRASH, updated);
}

export function emptyTrash() {
  setToStorage(STORAGE_KEYS.TRASH, []);
}

// Completions
export function getCompletions() {
  return getFromStorage(STORAGE_KEYS.COMPLETIONS, []);
}

export function getHabitCompletionForDate(habitId, dateStr) {
  const completions = getCompletions();
  return completions.find((c) => c.habitId === habitId && c.date === dateStr);
}

export function toggleHabitCompletion(habitId, dateStr, targetGoal = 1) {
  const completions = getCompletions();
  const existingIndex = completions.findIndex((c) => c.habitId === habitId && c.date === dateStr);

  if (existingIndex > -1) {
    const current = completions[existingIndex];
    if (current.count >= targetGoal) {
      // Undo completion
      completions.splice(existingIndex, 1);
    } else {
      // Increment count
      current.count += 1;
    }
  } else {
    // Add completion
    completions.push({
      id: `c-${Date.now()}`,
      habitId,
      date: dateStr,
      count: 1,
    });
  }
  setToStorage(STORAGE_KEYS.COMPLETIONS, completions);
  return completions;
}

export function setHabitCompletionCount(habitId, dateStr, count) {
  const completions = getCompletions();
  const existingIndex = completions.findIndex((c) => c.habitId === habitId && c.date === dateStr);

  if (count <= 0) {
    if (existingIndex > -1) {
      completions.splice(existingIndex, 1);
    }
  } else {
    if (existingIndex > -1) {
      completions[existingIndex].count = count;
    } else {
      completions.push({
        id: `c-${Date.now()}`,
        habitId,
        date: dateStr,
        count,
      });
    }
  }
  setToStorage(STORAGE_KEYS.COMPLETIONS, completions);
  return completions;
}

// Labels
export function getLabels() {
  return getFromStorage(STORAGE_KEYS.LABELS, []);
}

export function saveLabel(name, color = '#6366f1') {
  const labels = getLabels();
  const existing = labels.find((l) => l.name.toLowerCase() === name.toLowerCase());
  if (!existing) {
    const newLabel = { id: `lbl-${Date.now()}`, name, color };
    labels.push(newLabel);
    setToStorage(STORAGE_KEYS.LABELS, labels);
    return newLabel;
  }
  return existing;
}

export function deleteLabel(id) {
  const labels = getLabels();
  const labelToDelete = labels.find((l) => l.id === id);
  if (labelToDelete) {
    const updatedLabels = labels.filter((l) => l.id !== id);
    setToStorage(STORAGE_KEYS.LABELS, updatedLabels);

    // Also remove from habits
    const habits = getHabits();
    const updatedHabits = habits.map((h) => ({
      ...h,
      labels: (h.labels || []).filter((l) => l !== labelToDelete.name),
    }));
    setToStorage(STORAGE_KEYS.HABITS, updatedHabits);
  }
}

// Mood Score
export function getMood() {
  return getFromStorage(STORAGE_KEYS.MOOD, 4);
}

export function setMood(score) {
  setToStorage(STORAGE_KEYS.MOOD, score);
  return score;
}

// Statistics calculation
export function calculateStatistics(selectedDateStr, habitsList = null, completionsList = null) {
  const habits = habitsList !== null ? habitsList : getHabits();
  const activeHabits = habits.filter((h) => (h.status || '').toUpperCase() === 'ACTIVE');
  const completions = completionsList !== null ? completionsList : getCompletions();

  // Selected date status
  let completedTodayCount = 0;
  let inProgressCount = 0;
  let overdueCount = 0;

  activeHabits.forEach((habit) => {
    const c = completions.find((item) => String(item.habitId || item.habit) === String(habit.id) && item.date === selectedDateStr);
    const count = c ? c.count : (habit.todayCompletions || 0);
    const goal = habit.goal || 1;

    if (count >= goal) {
      completedTodayCount += 1;
    } else if (count > 0 && count < goal) {
      inProgressCount += 1;
    } else {
      // If start date is before selectedDate and count is 0, consider overdue or pending
      if (habit.startDate && habit.startDate < selectedDateStr) {
        overdueCount += 1;
      }
    }
  });

  // Calculate Streak
  let streak = 0;
  let checkDate = new Date();
  while (true) {
    const dStr = format(checkDate, 'yyyy-MM-dd');
    const dayCompletions = completions.filter((c) => c.date === dStr && c.count > 0);
    if (dayCompletions.length > 0) {
      streak += 1;
      checkDate = subDays(checkDate, 1);
    } else {
      // If today has no completions yet, check yesterday to keep streak alive
      if (isSameDay(checkDate, new Date())) {
        checkDate = subDays(checkDate, 1);
        continue;
      }
      break;
    }
  }

  // Calculate Habit Score (overall rate: percentage of completions vs possible target)
  const totalActive = activeHabits.length;
  const habitScore = totalActive > 0 ? Math.min(100, Math.round((completedTodayCount / totalActive) * 100)) : 0;

  return {
    completedToday: completedTodayCount,
    inProgress: inProgressCount,
    overdue: overdueCount,
    total: totalActive,
    streak,
    habitScore,
  };
}

// -------------------------------------------------------------
// HABIT STREAK CALCULATOR
// -------------------------------------------------------------
export function calculateHabitStreak(habitId, completions = []) {
  const habitCompletions = completions
    .filter((c) => String(c.habitId || c.habit) === String(habitId) && (c.count || 0) > 0)
    .map((c) => c.date);

  const compSet = new Set(habitCompletions);

  let currentStreak = 0;
  let checkDate = new Date();

  const todayStr = format(checkDate, 'yyyy-MM-dd');
  if (!compSet.has(todayStr)) {
    checkDate = subDays(checkDate, 1);
  }

  while (true) {
    const dStr = format(checkDate, 'yyyy-MM-dd');
    if (compSet.has(dStr)) {
      currentStreak += 1;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  const sortedDates = Array.from(compSet).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dStr of sortedDates) {
    const d = new Date(dStr);
    if (prevDate) {
      const diff = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        tempStreak += 1;
      } else {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    prevDate = d;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return {
    current: currentStreak,
    longest: Math.max(currentStreak, longestStreak),
  };
}

// -------------------------------------------------------------
// CHALLENGES STORAGE
// -------------------------------------------------------------
export function getChallenges() {
  return getFromStorage(STORAGE_KEYS.CHALLENGES, DEFAULT_CHALLENGES);
}

export function saveChallenge(challenge) {
  const list = getChallenges();
  if (challenge.id) {
    const updated = list.map((c) => (c.id === challenge.id ? { ...c, ...challenge } : c));
    setToStorage(STORAGE_KEYS.CHALLENGES, updated);
    return challenge;
  }
  const newC = {
    ...challenge,
    id: `ch-${Date.now()}`,
    startDate: challenge.startDate || format(new Date(), 'yyyy-MM-dd'),
    isCompleted: false,
  };
  setToStorage(STORAGE_KEYS.CHALLENGES, [newC, ...list]);
  return newC;
}

export function toggleChallengeCompletion(id) {
  const list = getChallenges();
  const updated = list.map((c) => (c.id === id ? { ...c, isCompleted: !c.isCompleted } : c));
  setToStorage(STORAGE_KEYS.CHALLENGES, updated);
  return updated;
}

export function deleteChallenge(id) {
  const list = getChallenges();
  const updated = list.filter((c) => c.id !== id);
  setToStorage(STORAGE_KEYS.CHALLENGES, updated);
  return updated;
}

// -------------------------------------------------------------
// POMODORO STORAGE
// -------------------------------------------------------------
export function getPomodoroSessions() {
  return getFromStorage(STORAGE_KEYS.POMODORO, []);
}

export function savePomodoroSession(session) {
  const list = getPomodoroSessions();
  const newSession = {
    id: `pomo-${Date.now()}`,
    habitId: session.habitId || null,
    habitTitle: session.habitTitle || 'General Focus',
    durationMinutes: session.durationMinutes || 25,
    completedAt: new Date().toISOString(),
  };
  const updated = [newSession, ...list];
  setToStorage(STORAGE_KEYS.POMODORO, updated);
  return newSession;
}

// -------------------------------------------------------------
// CSV EXPORT GENERATOR & DOWNLOADER
// -------------------------------------------------------------
export function generateHabitsCsv(habits = [], completions = []) {
  const headers = [
    'Habit ID',
    'Habit Name',
    'Category',
    'Frequency',
    'Target Goal',
    'Current Streak (Days)',
    'Best Streak (Days)',
    'Status',
    'Start Date',
    'End Date',
    'Reminder Time',
    'Labels',
    'Total Completions Logged',
    'Completion Dates Log',
  ];

  const rows = habits.map((h) => {
    const streakInfo = calculateHabitStreak(h.id, completions);
    const habitCompletions = completions.filter(
      (c) => String(c.habitId || c.habit) === String(h.id)
    );
    const totalComps = habitCompletions.reduce((sum, c) => sum + (c.count || 1), 0);
    const datesHistory = habitCompletions.map((c) => `${c.date}(x${c.count})`).join('; ');
    const labelsStr = Array.isArray(h.labels) ? h.labels.join(', ') : '';

    return [
      `"${h.id}"`,
      `"${(h.name || '').replace(/"/g, '""')}"`,
      `"${h.category || 'General'}"`,
      `"${h.repeat || h.frequency || 'Daily'}"`,
      h.goal || 1,
      streakInfo.current,
      streakInfo.longest,
      `"${h.status || 'Active'}"`,
      `"${h.startDate || ''}"`,
      `"${h.endDate || ''}"`,
      `"${h.reminderTime || ''}"`,
      `"${labelsStr}"`,
      totalComps,
      `"${datesHistory}"`,
    ];
  });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadCsv(csvContent, filename = null) {
  const name = filename || `habit_tracker_completions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
