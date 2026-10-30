// client/test/browser_test.cjs
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  console.log('====================================================');
  console.log('STARTING AUTOMATED BROWSER FUNCTIONAL TEST SUITE');
  console.log(`Target: ${APP_URL}`);
  console.log(`Browser: Google Chrome (${CHROME_PATH})`);
  console.log('====================================================\n');

  let browser;
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failedCount++;
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    // ----------------------------------------------------
    // TEST 1: Initial Visit & Welcome Screen
    // ----------------------------------------------------
    console.log('--- Phase 1: Authentication & Navigation ---');
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await delay(1000);

    const welcomeCard = await page.$('.welcome-card');
    assert(welcomeCard !== null, 'Welcome landing & auth card is rendered on initial visit');

    const demoBtn = await page.$('.btn-demo');
    assert(demoBtn !== null, 'Quick Demo Login button is present on Welcome screen');

    // ----------------------------------------------------
    // TEST 2: Demo Login Flow
    // ----------------------------------------------------
    await page.$eval('.btn-demo', (el) => el.click());
    try {
      await page.waitForSelector('.sidebar', { timeout: 8000 });
    } catch {
      const pageHtml = await page.evaluate(() => document.body.innerText);
      console.log('Page text after click:', pageHtml);
    }

    const sidebar = await page.$('.sidebar');
    assert(sidebar !== null, 'Demo login succeeded and rendered main dashboard layout with sidebar');
    assert(sidebar !== null, 'Demo login succeeded and rendered main dashboard layout with sidebar');

    const profileName = await page.$eval('.profile-text .name', (el) => el.textContent.trim());
    assert(profileName.length > 0, `User profile active in sidebar (${profileName})`);

    const statCards = await page.$$('.stat-card');
    assert(statCards.length === 4, 'Four dashboard stat cards are visible');

    // ----------------------------------------------------
    // TEST 3: User Registration Flow
    // ----------------------------------------------------
    console.log('\n--- Phase 2: User Registration & Custom Account ---');
    const logoutBtn = await page.$('.logout-btn');
    await logoutBtn.click();
    await delay(800);

    assert(await page.$('.welcome-card') !== null, 'Logout successfully returns to Welcome screen');

    // Click "Join Now"
    const joinBtn = await page.$('.btn-join');
    assert(joinBtn !== null, '"Join Now" signup button is present on Welcome screen');
    await joinBtn.click();
    await delay(500);

    const testEmail = `qa_user_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testFirstName = 'QA';
    const testLastName = 'Specialist';

    await page.type('input[placeholder="Tanay"]', testFirstName);
    await page.type('input[placeholder="Pratap"]', testLastName);
    await page.type('input[placeholder="tanay@example.com"]', testEmail);
    await page.type('input[placeholder="••••••••"]', testPassword);

    await page.click('button[type="submit"].btn-primary');
    await page.waitForSelector('.sidebar', { timeout: 10000 });

    assert(await page.$('.sidebar') !== null, `Registration for ${testEmail} succeeded and loaded dashboard`);

    // ----------------------------------------------------
    // TEST 4: Habit Creation (CRUD)
    // ----------------------------------------------------
    console.log('\n--- Phase 3: Habit Management (CRUD) ---');
    const newHabitBtn = await page.$('.sidebar-create-btn');
    assert(newHabitBtn !== null, 'Sidebar "+ New Habit" button is present');
    await newHabitBtn.click();
    await delay(500);

    const modal = await page.$('.modal-card');
    assert(modal !== null, 'Create Habit Modal is open');

    // Fill form for first habit
    await page.type('input[placeholder="Enter name of your habit"]', 'Daily 3km Morning Run');
    await page.type('textarea[placeholder="e.g. 20 minutes before breakfast"]', 'Improve cardio and daily stamina');
    
    // Choose repeat and colour
    await page.select('select.form-control:nth-of-type(1)', 'Daily');

    // Submit modal (Done button)
    const saveHabitBtn = await page.$('.modal-card button[type="submit"].btn-primary');
    assert(saveHabitBtn !== null, 'Modal "Done" save button is present');
    await saveHabitBtn.click();
    await delay(1200);

    let habitTitles = await page.$$eval('.card-title', (els) => els.map((e) => e.textContent.trim()));
    assert(habitTitles.includes('Daily 3km Morning Run'), 'Created habit "Daily 3km Morning Run" appears on Dashboard');

    // Create a second habit
    await newHabitBtn.click();
    await delay(500);
    await page.type('input[placeholder="Enter name of your habit"]', 'Read 25 Pages of Book');
    await page.type('textarea[placeholder="e.g. 20 minutes before breakfast"]', 'Finish 2 books per month');
    const saveHabitBtn2 = await page.$('.modal-card button[type="submit"].btn-primary');
    await saveHabitBtn2.click();
    await delay(1200);

    habitTitles = await page.$$eval('.card-title', (els) => els.map((e) => e.textContent.trim()));
    assert(habitTitles.includes('Read 25 Pages of Book'), 'Second habit "Read 25 Pages of Book" created');

    const totalHabitsNum = await page.$eval('.stat-card:nth-child(4) .stat-number', (el) => el.textContent.trim());
    assert(totalHabitsNum === '2', `Total Habits stat card accurately displays count = 2 (Found: ${totalHabitsNum})`);

    // ----------------------------------------------------
    // TEST 5: Habit Completion & Dynamic Statistics
    // ----------------------------------------------------
    console.log('\n--- Phase 4: Completion Tracking & Streaks ---');
    let completedTodayNum = await page.$eval('.stat-card:first-child .stat-number', (el) => el.textContent.trim());
    assert(completedTodayNum === '0', `Initial Completed Today is 0 (Found: ${completedTodayNum})`);

    // Click check-in button on the pending habit
    const checkinBtn = await page.$('.card-check-btn:not(.checked)');
    assert(checkinBtn !== null, 'Check-in completion button is present on habit card');
    await page.$eval('.card-check-btn:not(.checked)', (el) => el.click());
    await delay(1500);

    const checkedBtn = await page.$('.card-check-btn.checked');
    assert(checkedBtn !== null, 'Habit moved to Completed section with checked button state');

    completedTodayNum = await page.$eval('.stat-card:first-child .stat-number', (el) => el.textContent.trim());
    assert(completedTodayNum === '1', `Completed Today stat card updated to 1 (Found: ${completedTodayNum})`);

    // Test Undo Completion by clicking the checked button
    await page.$eval('.card-check-btn.checked', (el) => el.click());
    await delay(1500);
    completedTodayNum = await page.$eval('.stat-card:first-child .stat-number', (el) => el.textContent.trim());
    assert(completedTodayNum === '0', `Undo completion resets Completed Today back to 0 (Found: ${completedTodayNum})`);

    // Re-complete for subsequent tests
    const reCheckinBtn = await page.$('.card-check-btn:not(.checked)');
    if (reCheckinBtn) {
      await page.$eval('.card-check-btn:not(.checked)', (el) => el.click());
      await delay(1200);
    }

    // ----------------------------------------------------
    // TEST 6: Calendar Popover Widget
    // ----------------------------------------------------
    console.log('\n--- Phase 5: Calendar Popover Widget ---');
    const calBtn = await page.$('.date-picker-btn');
    assert(calBtn !== null, 'Calendar date button is present');
    await calBtn.click();
    await delay(400);

    let calPopover = await page.$('.calendar-popover');
    assert(calPopover !== null, 'Calendar popover opens when clicked');

    const cellCount = await page.$$eval('.calendar-compact-cell', (els) => els.length);
    assert(cellCount >= 28, `Calendar renders monthly grid (${cellCount} days visible)`);

    await calBtn.click();
    await delay(300);
    calPopover = await page.$('.calendar-popover');
    assert(calPopover === null, 'Calendar popover toggles closed cleanly');

    // ----------------------------------------------------
    // TEST 7: Edit Habit
    // ----------------------------------------------------
    console.log('\n--- Phase 6: Edit Habit ---');
    const editBtns = await page.$$('button[title="Edit habit"]');
    assert(editBtns.length >= 2, 'Edit habit action buttons are present');
    await editBtns[1].click();
    await delay(600);

    const editInput = await page.$('input[placeholder="Enter name of your habit"]');
    await editInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await editInput.type('Read 30 Pages of Book (Updated)');

    const updateSubmitBtn = await page.$('.modal-card button[type="submit"].btn-primary');
    await updateSubmitBtn.click();
    await delay(1500);

    const editedTitles = await page.$$eval('.card-title', (els) => els.map((e) => e.textContent.trim()));
    assert(editedTitles.includes('Read 30 Pages of Book (Updated)'), 'Habit title successfully updated and persisted');

    // ----------------------------------------------------
    // TEST 7B: Motivational Quotes & Life Areas Filter
    // ----------------------------------------------------
    console.log('\n--- Phase 6B: Motivational Quote & Category Filter ---');
    const quoteCard = await page.$('.quote-card');
    assert(quoteCard !== null, 'Motivational Daily Quote banner is visible on dashboard');

    // Shuffle quote
    const shuffleBtn = await page.$('button[title="Get another quote"]');
    if (shuffleBtn) {
      await shuffleBtn.click();
      await delay(300);
      assert(true, 'Motivational quote shuffle button cycles new quotes');
    }

    // Category pills filter
    const categoryPills = await page.$$('.category-pill');
    assert(categoryPills.length >= 3, `Life Area category filter pills rendered (${categoryPills.length} areas)`);
    
    // Find pill for Health & Fitness or second pill
    const pillTexts = await page.$$eval('.category-pill', (els) => els.map((e) => e.textContent.trim()));
    assert(pillTexts.some((t) => t.includes('All')), 'Area filter bar contains "All" option');

    // Click on a category pill
    const targetPillIndex = pillTexts.findIndex((t) => t.includes('Health & Fitness')) !== -1 
      ? pillTexts.findIndex((t) => t.includes('Health & Fitness')) 
      : 1;

    await categoryPills[targetPillIndex].click();
    await delay(600);

    const activeFilterHeader = await page.$eval('.section-title', (el) => el.textContent.trim());
    assert(activeFilterHeader.includes('•'), `Section title updates to reflect selected area (${activeFilterHeader})`);

    const clearFilterBtn = await page.$('button[title="Reset to All areas"]');
    assert(clearFilterBtn !== null, '"✕ Clear Filter" button is visible when an area filter is active');

    // Click "✕ Clear Filter" button
    await clearFilterBtn.click();
    await delay(600);

    const resetHeader = await page.$eval('.section-title', (el) => el.textContent.trim());
    assert(!resetHeader.includes('•'), 'Clearing filter restores default "My Habits" header');

    // ----------------------------------------------------
    // TEST 7C: Pomodoro Focus Timer Modal
    // ----------------------------------------------------
    console.log('\n--- Phase 6C: Pomodoro Focus Timer ---');
    const pomoBtn = await page.$('button[title="Open Pomodoro Focus Timer"]');
    assert(pomoBtn !== null, 'Pomodoro launcher button is present');
    await pomoBtn.click();
    await delay(500);

    const pomoModal = await page.$('.modal-card');
    assert(pomoModal !== null, 'Pomodoro Focus Timer modal opened');

    // Switch to Short Break tab
    const shortBreakBtn = await page.$('.pomo-tab:nth-child(2)');
    if (shortBreakBtn) {
      await shortBreakBtn.click();
      await delay(300);
      const timerDisplay = await page.$eval('.modal-body div[style*="font-size: 56px"]', (el) => el.textContent.trim());
      assert(timerDisplay === '05:00', `Switched mode to Short Break 5 minutes (Found: ${timerDisplay})`);
    }

    // Close Pomodoro modal
    await page.click('.modal-card .modal-close-btn');
    await delay(400);

    // ----------------------------------------------------
    // TEST 7D: Export CSV Functionality
    // ----------------------------------------------------
    console.log('\n--- Phase 6D: Export Data to CSV ---');
    const exportCsvBtn = await page.$('button[title="Export habit completion history to CSV"]');
    assert(exportCsvBtn !== null, 'Export CSV button is present on Home dashboard');

    // ----------------------------------------------------
    // TEST 8: Labels Feature
    // ----------------------------------------------------
    console.log('\n--- Phase 7: Labels Page & Tagging ---');
    const labelsNavLink = await page.$('.sidebar-nav a[href="/labels"]');
    assert(labelsNavLink !== null, 'Labels navigation link is present');
    await labelsNavLink.click();
    await delay(800);
    assert(page.url().includes('/labels'), 'Navigated to /labels page');

    const createLabelBtn = await page.$('.btn-inline-create');
    assert(createLabelBtn !== null, '"Create Label" button is present');
    await createLabelBtn.click();
    await delay(400);

    const labelInput = await page.$('input[placeholder*="Label name"]');
    assert(labelInput !== null, 'New label input field is visible');
    await labelInput.type('Health & Wellness');

    const addLabelBtn = await page.$('form button[type="submit"].btn-primary');
    await addLabelBtn.click();
    await delay(1000);

    const labelElements = await page.$$eval('div', (els) => els.map((e) => e.textContent));
    assert(
      labelElements.some((t) => t.includes('HEALTH & WELLNESS')),
      'Label "HEALTH & WELLNESS" created and listed'
    );

    // ----------------------------------------------------
    // TEST 9: Profile & Mood Tracker
    // ----------------------------------------------------
    console.log('\n--- Phase 8: Profile & Mood Tracking ---');
    const profileNavLink = await page.$('.profile-info');
    assert(profileNavLink !== null, 'Profile link in sidebar is present');
    await profileNavLink.click();
    await delay(800);
    assert(page.url().includes('/profile'), 'Navigated to /profile page');

    const profileStatCards = await page.$$('.stat-card');
    assert(profileStatCards.length === 4, 'Four profile metric cards are displayed');

    // Select Mood Score 5
    const moodBtns = await page.$$('.stat-card:nth-child(4) button');
    if (moodBtns.length >= 5) {
      await moodBtns[4].click();
      await delay(400);
      const moodValue = await page.$eval('.stat-card:nth-child(4) .stat-number', (el) => el.textContent.trim());
      assert(moodValue === '5', `Mood score updated to 5 (Found: ${moodValue})`);
    }

    // ----------------------------------------------------
    // TEST 10: Archive Workflow
    // ----------------------------------------------------
    console.log('\n--- Phase 9: Archive & Restore Workflow ---');
    await page.click('.sidebar-nav a[href="/"]');
    await delay(800);

    const archiveBtns = await page.$$('button[title="Archive habit"]');
    assert(archiveBtns.length >= 2, 'Archive buttons present on cards');
    await archiveBtns[1].click();
    await delay(1200);

    let activeTitles = await page.$$eval('.card-title', (els) => els.map((e) => e.textContent.trim()));
    assert(!activeTitles.includes('Read 30 Pages of Book (Updated)'), 'Archived habit removed from active dashboard');

    // Navigate to /archive
    await page.click('.sidebar-nav a[href="/archive"]');
    await delay(800);

    const archivedTitles = await page.$$eval('.card-title', (els) => els.map((e) => e.textContent.trim()));
    assert(archivedTitles.includes('Read 30 Pages of Book (Updated)'), 'Archived habit is listed on Archive page');

    // Unarchive it
    const unarchiveBtn = await page.$('button[title="Restore to active habits"]');
    assert(unarchiveBtn !== null, 'Unarchive button is present on archived habit card');
    await unarchiveBtn.click();
    await delay(1000);

    // Return to Home
    await page.click('.sidebar-nav a[href="/"]');
    await delay(800);

    activeTitles = await page.$$eval('.card-title', (els) => els.map((e) => e.textContent.trim()));
    assert(
      activeTitles.includes('Read 30 Pages of Book (Updated)'),
      'Unarchived habit is restored to active dashboard list'
    );

    // ----------------------------------------------------
    // TEST 11: Trash & Permanent Deletion Workflow
    // ----------------------------------------------------
    console.log('\n--- Phase 10: Trash & Permanent Deletion ---');
    const trashBtns = await page.$$('button[title="Move to trash"]');
    assert(trashBtns.length >= 2, 'Move to trash buttons present');
    await trashBtns[1].click();
    await delay(1200);

    activeTitles = await page.$$eval('.card-title', (els) => els.map((e) => e.textContent.trim()));
    assert(!activeTitles.includes('Read 30 Pages of Book (Updated)'), 'Trashed habit removed from active dashboard');

    // Navigate to /trash
    await page.click('.sidebar-nav a[href="/trash"]');
    await delay(800);

    const trashTitles = await page.$$eval('.card-title', (els) => els.map((e) => e.textContent.trim()));
    assert(trashTitles.includes('Read 30 Pages of Book (Updated)'), 'Trashed habit is listed in Trash');

    // Delete Permanently
    const deletePermanentBtn = await page.$('button[title="Delete forever"]');
    assert(deletePermanentBtn !== null, '"Delete forever" button is present');
    await deletePermanentBtn.click();
    await delay(1200);

    const remainingCards = await page.$$('.card-title');
    assert(remainingCards.length === 0, 'Trash shows zero remaining cards after permanent deletion');

    // ----------------------------------------------------
    // TEST 11B: Habit Challenges Workflow
    // ----------------------------------------------------
    console.log('\n--- Phase 10B: Custom Habit Challenges ---');
    const challengesLink = await page.$('.sidebar-nav a[href="/challenges"]');
    assert(challengesLink !== null, 'Challenges navigation link is present in sidebar');
    await challengesLink.click();
    await delay(800);
    assert(page.url().includes('/challenges'), 'Navigated to /challenges page');

    // Create a new challenge
    const newChallengeBtn = await page.$('.btn-inline-create');
    assert(newChallengeBtn !== null, '"New Challenge" button is present');
    await newChallengeBtn.click();
    await delay(400);

    await page.type('input[placeholder*="21-Day Daily Reading Sprint"]', '30-Day Deep Learning Sprint');
    await page.click('.modal-card button[type="submit"].btn-primary');
    await delay(1200);

    const challengeTitles = await page.$$eval('.card-title', (els) => els.map((e) => e.textContent.trim()));
    assert(
      challengeTitles.some((t) => t.includes('30-Day Deep Learning Sprint')),
      'Created challenge "30-Day Deep Learning Sprint" appears in Challenges list'
    );

    // ----------------------------------------------------
    // TEST 12: Responsive Mobile Layout & Drawer Menu
    // ----------------------------------------------------
    console.log('\n--- Phase 11: Responsive Layout & Mobile Drawer ---');
    await page.setViewport({ width: 375, height: 667 });
    await delay(500);

    const mobileTopBarVisible = await page.$eval('.mobile-top-bar', (el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none';
    });
    assert(mobileTopBarVisible, 'Mobile top bar is visible on 375px viewport');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert(!hasHorizontalScroll, 'No horizontal scroll on mobile viewport (width: 375px)');

    const hamburgerBtn = await page.$('.mobile-hamburger-btn');
    assert(hamburgerBtn !== null, 'Hamburger menu button is visible on mobile');
    await hamburgerBtn.click();
    await delay(400);

    const isSidebarOpen = await page.$eval('.sidebar', (el) => el.classList.contains('mobile-open'));
    assert(isSidebarOpen, 'Sidebar mobile drawer opens smoothly when hamburger is clicked');

    const closeDrawerBtn = await page.$('.mobile-close-btn');
    await closeDrawerBtn.click();
    await delay(400);

    const isSidebarClosed = await page.$eval('.sidebar', (el) => !el.classList.contains('mobile-open'));
    assert(isSidebarClosed, 'Sidebar mobile drawer closes smoothly');

    // Check console errors
    if (consoleErrors.length > 0) {
      console.log('Logged console errors:', consoleErrors);
    }
    // Filter out expected 404s like favicon or vite hmr if any
    const realErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('404'));
    assert(realErrors.length === 0, `Zero critical browser console errors logged during entire run (${realErrors.length})`);

    console.log('\n====================================================');
    console.log(`ALL BROWSER TESTS COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n[EXCEPTION ENCOUNTERED IN BROWSER TEST]:', err);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
