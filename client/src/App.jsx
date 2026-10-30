// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";

import {
  initStorage,
  getCurrentUser as getLocalUser,
  loginUser as localLogin,
  signupUser as localSignup,
  logoutUser as localLogout,
  getHabits as getLocalHabits,
  saveHabit as saveLocalHabit,
  archiveHabit as archiveLocalHabit,
  unarchiveHabit as unarchiveLocalHabit,
  moveToTrash as trashLocalHabit,
  getTrash as getLocalTrash,
  restoreFromTrash as restoreLocalTrash,
  deletePermanently as deleteLocalPermanent,
  emptyTrash as emptyLocalTrash,
  getCompletions as getLocalCompletions,
  toggleHabitCompletion as toggleLocalCompletion,
  getLabels as getLocalLabels,
  saveLabel as saveLocalLabel,
  deleteLabel as deleteLocalLabel,
  getChallenges as getLocalChallenges,
  saveChallenge as saveLocalChallenge,
  toggleChallengeCompletion as toggleLocalChallenge,
  deleteChallenge as deleteLocalChallenge,
  getPomodoroSessions as getLocalPomodoro,
  savePomodoroSession as saveLocalPomodoro,
  getMood,
  setMood,
  calculateStatistics,
} from "./services/storage";

import { apiClient } from "./services/apiClient";

import Sidebar from "./components/Sidebar";
import HeaderSearch from "./components/HeaderSearch";
import HabitModal from "./components/HabitModal";
import PomodoroModal from "./components/PomodoroModal";
import { IconMenu, IconPlus } from "./components/Icons";

import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import Labels from "./pages/Labels";
import Archive from "./pages/Archive";
import Trash from "./pages/Trash";
import Profile from "./pages/Profile";
import Challenges from "./pages/Challenges";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Storage and User state
  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [labels, setLabels] = useState([]);
  const [trash, setTrash] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [mood, setMoodState] = useState(4);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [serverOnline, setServerOnline] = useState(true);

  // Mobile menu and Modal State
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  // Pomodoro & Reminder State
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [pomodoroHabit, setPomodoroHabit] = useState(null);
  const [activeReminderToast, setActiveReminderToast] = useState(null);

  // Initialize data on mount
  useEffect(() => {
    initStorage();
    checkAuthAndLoad();
  }, []);

  // When selectedDate changes, refresh habits and stats
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [selectedDate]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Request browser notification permission if available
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Background reminder checker (runs every 30 seconds)
  useEffect(() => {
    const checkReminders = () => {
      const nowTime = format(new Date(), "HH:mm");
      const matched = habits.find(
        (h) => (h.status || "").toUpperCase() === "ACTIVE" && h.reminderTime === nowTime
      );
      if (matched) {
        setActiveReminderToast(`🔔 Reminder: It's time for "${matched.name}"!`);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Habit Reminder: ${matched.name}`, {
            body: matched.description || "Time to complete your habit today!",
            icon: "🎯",
          });
        }
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [habits]);

  const checkAuthAndLoad = async () => {
    const token = localStorage.getItem("backend_token");
    if (token) {
      try {
        const currentUser = await apiClient.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setServerOnline(true);
          await loadServerData(selectedDate);
          return;
        }
      } catch (err) {
        console.warn("Backend session check failed:", err);
      }
    }

    const localU = getLocalUser();
    if (localU) {
      setUser(localU);
      loadLocalData();
    }
  };

  const loadServerData = async (dateStr) => {
    try {
      const [habitsData, compsData, labelsData, trashData, challengesData] =
        await Promise.all([
          apiClient.getHabits("all", dateStr),
          apiClient.getAllCompletions(),
          apiClient.getLabels(),
          apiClient.getTrash(),
          apiClient.getChallenges(),
        ]);
      setHabits(habitsData);
      setCompletions(compsData);
      setLabels(labelsData);
      setTrash(trashData);
      setChallenges(challengesData);
      setServerOnline(true);
    } catch (err) {
      console.warn("Server fetch failed, falling back to local storage:", err);
      setServerOnline(false);
      loadLocalData();
    }
  };

  const loadLocalData = () => {
    setHabits(getLocalHabits());
    setCompletions(getLocalCompletions());
    setLabels(getLocalLabels());
    setTrash(getLocalTrash());
    setChallenges(getLocalChallenges());
    setMoodState(getMood());
  };

  const refreshData = async () => {
    if (serverOnline && localStorage.getItem("backend_token")) {
      await loadServerData(selectedDate);
    } else {
      loadLocalData();
    }
  };

  // Auth Handlers
  const handleLogin = async (email, password) => {
    try {
      const loggedUser = await apiClient.login(email, password);
      setUser(loggedUser);
      setServerOnline(true);
      await loadServerData(selectedDate);
      navigate("/");
    } catch (err) {
      const isNetworkError =
        err.message &&
        (err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError") ||
          err.message.includes("Network request failed"));
      if (!isNetworkError) {
        throw err;
      }
      console.warn("Server offline, using local fallback:", err);
      const fallbackUser = localLogin(email, password);
      setUser(fallbackUser);
      setServerOnline(false);
      loadLocalData();
      navigate("/");
    }
  };

  const handleSignup = async (first, last, email, password) => {
    try {
      const newUser = await apiClient.signup(first, last, email, password);
      setUser(newUser);
      setServerOnline(true);
      await loadServerData(selectedDate);
      navigate("/");
    } catch (err) {
      const isNetworkError =
        err.message &&
        (err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError") ||
          err.message.includes("Network request failed"));
      if (!isNetworkError) {
        throw err;
      }
      console.warn("Server offline, using local fallback:", err);
      const fallbackUser = localSignup(first, last, email, password);
      setUser(fallbackUser);
      setServerOnline(false);
      loadLocalData();
      navigate("/");
    }
  };

  const handleLogout = async () => {
    try {
      if (serverOnline) {
        await apiClient.logout();
      }
    } catch (e) {
      console.error(e);
    }
    localLogout();
    setUser(null);
    setIsMobileNavOpen(false);
    navigate("/");
  };

  // Habit Actions
  const handleOpenCreate = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleSaveHabit = async (habitData) => {
    if (serverOnline && localStorage.getItem("backend_token")) {
      try {
        const hasId = habitData.id !== undefined && habitData.id !== null;
        if (hasId) {
          await apiClient.updateHabit(habitData.id, habitData);
        } else {
          await apiClient.createHabit(habitData);
        }
        await refreshData();
        return;
      } catch (e) {
        console.error("Failed to save habit on server:", e);
      }
    }
    saveLocalHabit(habitData);
    refreshData();
  };

  const handleArchiveHabit = async (id) => {
    const isServerId = id !== undefined && id !== null && !isNaN(Number(id));
    if (serverOnline && isServerId) {
      try {
        await apiClient.archiveHabit(Number(id));
        await refreshData();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    archiveLocalHabit(id);
    refreshData();
  };

  const handleUnarchiveHabit = async (id) => {
    const isServerId = id !== undefined && id !== null && !isNaN(Number(id));
    if (serverOnline && isServerId) {
      try {
        await apiClient.unarchiveHabit(Number(id));
        await refreshData();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    unarchiveLocalHabit(id);
    refreshData();
  };

  const handleTrashHabit = async (id) => {
    const isServerId = id !== undefined && id !== null && !isNaN(Number(id));
    if (serverOnline && isServerId) {
      try {
        await apiClient.trashHabit(Number(id));
        await refreshData();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    trashLocalHabit(id);
    refreshData();
  };

  const handleRestoreFromTrash = async (id) => {
    const isServerId = id !== undefined && id !== null && !isNaN(Number(id));
    if (serverOnline && isServerId) {
      try {
        await apiClient.restoreTrash(Number(id));
        await refreshData();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    restoreLocalTrash(id);
    refreshData();
  };

  const handlePermanentDelete = async (id) => {
    const isServerId = id !== undefined && id !== null && !isNaN(Number(id));
    if (serverOnline && isServerId) {
      try {
        await apiClient.permanentDelete(Number(id));
        await refreshData();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    deleteLocalPermanent(id);
    refreshData();
  };

  const handleEmptyTrash = async () => {
    if (serverOnline) {
      try {
        await apiClient.emptyTrash();
        await refreshData();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    emptyLocalTrash();
    refreshData();
  };

  // Completion Tracking
  const handleToggleComplete = async (habitId, goal = 1) => {
    const existing = completions.find(
      (c) =>
        String(c.habitId || c.habit) === String(habitId) &&
        c.date === selectedDate,
    );

    if (serverOnline && !isNaN(Number(habitId))) {
      try {
        if (!existing || existing.count === 0) {
          await apiClient.recordCompletion(Number(habitId), selectedDate, goal);
        } else {
          await apiClient.undoCompletion(Number(habitId), selectedDate);
        }
        await refreshData();
        return;
      } catch (e) {
        console.error("Server completion toggle failed:", e);
      }
    }

    toggleLocalCompletion(habitId, selectedDate, goal);
    refreshData();
  };

  // Label Actions
  const handleSaveLabel = async (name) => {
    if (serverOnline) {
      try {
        await apiClient.createLabel(name);
        await refreshData();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    saveLocalLabel({ name });
    refreshData();
  };

  const handleDeleteLabel = async (id) => {
    if (serverOnline && typeof id === "number") {
      try {
        await apiClient.deleteLabel(id);
        await refreshData();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    deleteLocalLabel(id);
    refreshData();
  };

  // Challenge Actions
  const handleSaveChallenge = async (challengeData) => {
    if (serverOnline) {
      try {
        await apiClient.createChallenge(challengeData);
        await refreshData();
        return;
      } catch (e) {
        console.error("Server challenge save failed:", e);
      }
    }
    saveLocalChallenge(challengeData);
    refreshData();
  };

  const handleToggleChallenge = async (id) => {
    const current = challenges.find((c) => String(c.id) === String(id));
    if (serverOnline && typeof id === "number") {
      try {
        await apiClient.updateChallenge(id, { isCompleted: !current?.isCompleted });
        await refreshData();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    toggleLocalChallenge(id);
    refreshData();
  };

  const handleDeleteChallenge = async (id) => {
    if (serverOnline && typeof id === "number") {
      try {
        await apiClient.deleteChallenge(id);
        await refreshData();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    deleteLocalChallenge(id);
    refreshData();
  };

  const handleAdoptChallengeAsHabit = async (challenge) => {
    await handleSaveHabit({
      name: challenge.title,
      description: challenge.description || `Adopted from ${challenge.durationDays}-day challenge`,
      category: challenge.category || "Personal",
      repeat: "Daily",
      goal: 1,
      color: "blue",
      startDate: format(new Date(), "yyyy-MM-dd"),
      status: "Active",
    });
    navigate("/");
  };

  // Pomodoro Actions
  const handleOpenPomodoro = (habit = null) => {
    setPomodoroHabit(habit);
    setIsPomodoroOpen(true);
  };

  const handleLogPomodoroSession = async (sessionData) => {
    if (serverOnline) {
      try {
        await apiClient.createPomodoro({
          habit: sessionData.habitId && !isNaN(Number(sessionData.habitId)) ? Number(sessionData.habitId) : null,
          durationMinutes: sessionData.durationMinutes || 25,
        });
      } catch (e) {
        console.error("Pomodoro log server failed:", e);
      }
    }
    saveLocalPomodoro(sessionData);
  };

  const handleAutoIncrementHabit = async (habitId) => {
    await handleToggleComplete(habitId, 1);
  };

  // Mood Action
  const handleSetMood = (score) => {
    setMood(score);
    setMoodState(score);
  };

  // If not logged in, render the Welcome Landing screen
  if (!user) {
    return <Welcome onLogin={handleLogin} onSignup={handleSignup} />;
  }

  const stats = calculateStatistics(selectedDate, habits, completions);
  const showTopSearch = location.pathname !== "/";

  return (
    <div className="app-layout">
      {/* Reminder In-App Toast Banner */}
      {activeReminderToast && (
        <div 
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#0d9488",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 9999,
            fontWeight: 700,
            fontSize: "14px",
            animation: "slideIn 0.3s ease",
          }}
        >
          <span>{activeReminderToast}</span>
          <button
            type="button"
            onClick={() => setActiveReminderToast(null)}
            style={{ color: "#ffffff", fontSize: "16px", fontWeight: 800, padding: "0 4px" }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Mobile Top App Bar */}
      <header className="mobile-top-bar">
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setIsMobileNavOpen(true)}
          aria-label="Open menu"
        >
          <IconMenu style={{ width: "24px", height: "24px" }} />
        </button>

        <div className="mobile-brand" onClick={() => navigate("/")}>
          <span style={{ fontSize: "20px" }}>🎯</span>
          <span className="mobile-brand-title">MyWebsite</span>
        </div>

        <button
          type="button"
          className="mobile-quick-add-btn"
          onClick={handleOpenCreate}
          title="Create habit"
        >
          <IconPlus style={{ width: "18px", height: "18px" }} />
          <span>New</span>
        </button>
      </header>

      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        onOpenCreate={handleOpenCreate}
        onLogout={handleLogout}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        onOpenPomodoro={() => handleOpenPomodoro(null)}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {showTopSearch && (
          <HeaderSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder={
              location.pathname === "/labels"
                ? "Search labels..."
                : location.pathname === "/challenges"
                  ? "Search challenges..."
                  : location.pathname === "/archive"
                    ? "Search archived habits..."
                    : location.pathname === "/trash"
                      ? "Search trashed habits..."
                      : "Search habits, challenges, anything"
            }
          />
        )}

        <Routes>
          <Route
            path="/"
            element={
              <Home
                user={user}
                habits={habits}
                completions={completions}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onToggleComplete={handleToggleComplete}
                onOpenCreate={handleOpenCreate}
                onEditHabit={handleEditHabit}
                onArchiveHabit={handleArchiveHabit}
                onTrashHabit={handleTrashHabit}
                onOpenPomodoro={() => handleOpenPomodoro(null)}
                onStartPomodoro={(habit) => handleOpenPomodoro(habit)}
                stats={stats}
              />
            }
          />
          <Route
            path="/challenges"
            element={
              <Challenges
                challenges={challenges}
                onSaveChallenge={handleSaveChallenge}
                onToggleComplete={handleToggleChallenge}
                onDeleteChallenge={handleDeleteChallenge}
                onAdoptAsHabit={handleAdoptChallengeAsHabit}
              />
            }
          />
          <Route
            path="/labels"
            element={
              <Labels
                labels={labels}
                habits={habits}
                onSaveLabel={handleSaveLabel}
                onDeleteLabel={handleDeleteLabel}
                searchQuery={searchQuery}
              />
            }
          />
          <Route
            path="/archive"
            element={
              <Archive
                habits={habits}
                onUnarchive={handleUnarchiveHabit}
                onTrash={handleTrashHabit}
                searchQuery={searchQuery}
              />
            }
          />
          <Route
            path="/trash"
            element={
              <Trash
                trash={trash}
                onRestore={handleRestoreFromTrash}
                onPermanentDelete={handlePermanentDelete}
                onEmptyTrash={handleEmptyTrash}
                searchQuery={searchQuery}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <Profile
                user={user}
                stats={stats}
                mood={mood}
                onSetMood={handleSetMood}
                onLogout={handleLogout}
              />
            }
          />
        </Routes>
      </div>

      {/* Global Habit Modal (New / Edit) */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHabit}
        initialData={editingHabit}
        availableLabels={labels}
      />

      {/* Pomodoro Focus Modal */}
      <PomodoroModal
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        habits={habits.filter((h) => (h.status || "").toUpperCase() === "ACTIVE")}
        initialHabit={pomodoroHabit}
        onLogSession={handleLogPomodoroSession}
        onAutoIncrementHabit={handleAutoIncrementHabit}
      />
    </div>
  );
}
