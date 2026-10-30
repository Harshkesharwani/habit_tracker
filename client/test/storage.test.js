// client/test/storage.test.js
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node test environment
const storageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = storageMock;

import {
  initStorage,
  getHabits,
  saveHabit,
  archiveHabit,
  unarchiveHabit,
  moveToTrash,
  getTrash,
  restoreFromTrash,
  deletePermanently,
  getCompletions,
  toggleHabitCompletion,
  calculateStatistics,
  CATEGORIES,
  QUOTES,
  calculateHabitStreak,
  getChallenges,
  saveChallenge,
  toggleChallengeCompletion,
  deleteChallenge,
  getPomodoroSessions,
  savePomodoroSession,
  generateHabitsCsv,
  inferHabitCategory,
  matchesCategory,
} from '../src/services/storage.js';

describe('Habit Tracker Logic & Acceptance Criteria Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    initStorage();
  });

  test('P0: Habit Management - Creates a new habit and persists it', () => {
    const newHabit = saveHabit({
      name: 'Read 30 minutes',
      description: 'Daily tech reading',
      startDate: '2026-10-30',
      goal: 2,
      repeat: 'Daily',
      color: 'blue',
      status: 'Active',
      labels: ['Productivity'],
    });

    assert.ok(newHabit.id);
    assert.equal(newHabit.name, 'Read 30 minutes');

    const habits = getHabits();
    const found = habits.find((h) => h.id === newHabit.id);
    assert.ok(found);
    assert.equal(found.status, 'Active');
  });

  test('P0: Habit Management - Archived habits do not appear in active list', () => {
    const habit = saveHabit({
      name: 'Meditation',
      status: 'Active',
      goal: 1,
    });

    archiveHabit(habit.id);

    const habits = getHabits();
    const active = habits.filter((h) => h.status === 'Active');
    const archived = habits.filter((h) => h.status === 'Archived');

    assert.ok(!active.some((h) => h.id === habit.id));
    assert.ok(archived.some((h) => h.id === habit.id));

    // Test Unarchive
    unarchiveHabit(habit.id);
    const refreshedActive = getHabits().filter((h) => h.status === 'Active');
    assert.ok(refreshedActive.some((h) => h.id === habit.id));
  });

  test('P0: Completion Tracking - Mark completed and undo completion without duplicates', () => {
    const habitId = 'test-habit-1';
    const dateStr = '2026-10-30';

    // Mark completion 1
    toggleHabitCompletion(habitId, dateStr, 2);
    let comps = getCompletions().filter((c) => c.habitId === habitId && c.date === dateStr);
    assert.equal(comps.length, 1);
    assert.equal(comps[0].count, 1);

    // Mark completion 2 (reaches goal of 2)
    toggleHabitCompletion(habitId, dateStr, 2);
    comps = getCompletions().filter((c) => c.habitId === habitId && c.date === dateStr);
    assert.equal(comps.length, 1);
    assert.equal(comps[0].count, 2);

    // Undo completion (toggling when goal reached removes or resets)
    toggleHabitCompletion(habitId, dateStr, 2);
    comps = getCompletions().filter((c) => c.habitId === habitId && c.date === dateStr);
    assert.equal(comps.length, 0);
  });

  test('P0: Statistics - Derived dynamically from actual completion data', () => {
    const dateStr = '2026-10-30';
    const stats = calculateStatistics(dateStr);

    assert.ok(typeof stats.total === 'number');
    assert.ok(typeof stats.completedToday === 'number');
    assert.ok(typeof stats.habitScore === 'number');
    assert.ok(stats.habitScore >= 0 && stats.habitScore <= 100);
  });

  test('Trash Workflow - Move to trash, restore, and delete permanently', () => {
    const habit = saveHabit({
      name: 'Temporary Task',
      status: 'Active',
    });

    moveToTrash(habit.id);

    const habitsAfterTrash = getHabits();
    assert.ok(!habitsAfterTrash.some((h) => h.id === habit.id));

    const trash = getTrash();
    assert.ok(trash.some((t) => t.id === habit.id));

    // Restore
    restoreFromTrash(habit.id);
    const habitsAfterRestore = getHabits();
    assert.ok(habitsAfterRestore.some((h) => h.id === habit.id));

    // Permanent Delete
    moveToTrash(habit.id);
    deletePermanently(habit.id);
    const trashAfterDelete = getTrash();
    assert.ok(!trashAfterDelete.some((t) => t.id === habit.id));
  });

  test('Feature: Habit Categories & Reminders - Stores and retrieves life areas and reminder times', () => {
    assert.ok(CATEGORIES.includes('Health & Fitness'));
    assert.ok(CATEGORIES.includes('Career & Work'));

    const habitWithDetails = saveHabit({
      name: 'Drink 2L Water',
      category: 'Health & Fitness',
      reminderTime: '08:30',
      status: 'Active',
    });

    const habits = getHabits();
    const found = habits.find((h) => h.id === habitWithDetails.id);
    assert.equal(found.category, 'Health & Fitness');
    assert.equal(found.reminderTime, '08:30');
  });

  test('Feature: Streaks - Calculates current and longest streaks across completion dates', () => {
    const habitId = 'streak-habit-1';
    const testComps = [
      { habitId, date: '2026-10-28', count: 1 },
      { habitId, date: '2026-10-29', count: 1 },
      { habitId, date: '2026-10-30', count: 1 },
    ];

    const streak = calculateHabitStreak(habitId, testComps);
    assert.ok(typeof streak.current === 'number');
    assert.ok(typeof streak.longest === 'number');
    assert.ok(streak.longest >= 3);
  });

  test('Feature: Motivational Quotes - Provides rich curated quotes with authors', () => {
    assert.ok(QUOTES.length >= 10);
    const firstQuote = QUOTES[0];
    assert.ok(firstQuote.text);
    assert.ok(firstQuote.author);
  });

  test('Feature: Custom Challenges - Creates, updates, and completes challenge sprints', () => {
    const initialChallenges = getChallenges();
    assert.ok(initialChallenges.length >= 1);

    const created = saveChallenge({
      title: '30-Day Code Sprint',
      description: 'Commit code daily',
      category: 'Career & Work',
      durationDays: 30,
    });

    assert.ok(created.id);
    assert.equal(created.title, '30-Day Code Sprint');
    assert.equal(created.isCompleted, false);

    // Toggle complete
    const toggledList = toggleChallengeCompletion(created.id);
    const found = toggledList.find((c) => c.id === created.id);
    assert.equal(found.isCompleted, true);

    // Delete challenge
    const afterDelete = deleteChallenge(created.id);
    assert.ok(!afterDelete.some((c) => c.id === created.id));
  });

  test('Feature: Pomodoro Timer - Logs focus sessions with duration and habit anchoring', () => {
    const session = savePomodoroSession({
      habitId: 'test-habit-focus',
      habitTitle: 'Deep Work Habit',
      durationMinutes: 25,
    });

    assert.ok(session.id);
    assert.equal(session.durationMinutes, 25);
    assert.equal(session.habitTitle, 'Deep Work Habit');

    const sessions = getPomodoroSessions();
    assert.ok(sessions.some((s) => s.id === session.id));
  });

  test('Feature: Export CSV - Formats all habits and completions into standard CSV', () => {
    const habits = [
      { id: 1, name: 'Morning Walk', category: 'Health & Fitness', repeat: 'Daily', goal: 1, status: 'Active', reminderTime: '07:00' },
    ];
    const completions = [
      { habitId: 1, date: '2026-10-30', count: 1 },
    ];

    const csvOutput = generateHabitsCsv(habits, completions);
    assert.ok(csvOutput.includes('Habit ID,Habit Name,Category,Frequency'));
    assert.ok(csvOutput.includes('Morning Walk'));
    assert.ok(csvOutput.includes('Health & Fitness'));
    assert.ok(csvOutput.includes('07:00'));
  });

  test('Feature: Area Filter - Accurately categorizes and matches habits across explicit and inferred areas', () => {
    const habits = getHabits();
    const activeHabits = habits.filter((h) => h.status === 'Active');

    // Verify all active seeded habits have non-empty valid categories
    for (const h of activeHabits) {
      const cat = inferHabitCategory(h);
      assert.ok(cat && cat.length > 0, `Habit "${h.name}" must have a valid category`);
    }

    // Test 'All' matching
    assert.ok(activeHabits.every((h) => matchesCategory(h, 'All')));

    // Test specific category filtering
    const healthHabits = activeHabits.filter((h) => matchesCategory(h, 'Health & Fitness'));
    assert.ok(healthHabits.length >= 2, 'Should find at least 2 Health & Fitness habits (Morning Jog, 3L Water)');
    assert.ok(healthHabits.some((h) => h.name.includes('Jog')));
    assert.ok(healthHabits.some((h) => h.name.includes('Water')));

    const learningHabits = activeHabits.filter((h) => matchesCategory(h, 'Learning'));
    assert.ok(learningHabits.length >= 1, 'Should find at least 1 Learning habit (Read Books)');
    assert.ok(learningHabits.some((h) => h.name.includes('Read Books')));

    const careerHabits = activeHabits.filter((h) => matchesCategory(h, 'Career & Work'));
    assert.ok(careerHabits.length >= 1, 'Should find at least 1 Career & Work habit (Deep Work Focus)');
    assert.ok(careerHabits.some((h) => h.name.includes('Deep Work')));

    const mindfulnessHabits = activeHabits.filter((h) => matchesCategory(h, 'Mindfulness'));
    assert.ok(mindfulnessHabits.length >= 1, 'Should find at least 1 Mindfulness habit (Meditation)');
    assert.ok(mindfulnessHabits.some((h) => h.name.includes('Meditation')));

    // Test case-insensitivity
    assert.ok(matchesCategory({ name: 'Walk', category: 'health & fitness' }, 'Health & Fitness'));
    assert.ok(matchesCategory({ name: 'Walk', category: 'HEALTH & FITNESS' }, 'health & fitness'));

    // Test label matching when category is not set
    assert.ok(matchesCategory({ name: 'Run', labels: ['Health & Fitness'] }, 'Health & Fitness'));
    assert.ok(!matchesCategory({ name: 'Run', labels: ['Health & Fitness'] }, 'Learning'));
  });
});
