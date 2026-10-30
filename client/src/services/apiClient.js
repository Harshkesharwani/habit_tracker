// client/src/services/apiClient.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('backend_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return headers;
}

async function apiFetch(url, options = {}) {
  const headers = getAuthHeaders();
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  if (res.status === 401) {
    localStorage.removeItem('backend_token');
  }
  return res;
}

export const apiClient = {
  // Check if backend is reachable
  isBackendAvailable: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/habits`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return res.status === 200 || res.status === 401;
    } catch {
      return false;
    }
  },

  // Auth
  signup: async (firstName, lastName, email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Signup failed');
    }
    localStorage.setItem('backend_token', data.token);
    return data.user;
  },

  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }
    localStorage.setItem('backend_token', data.token);
    return data.user;
  },

  logout: async () => {
    try {
      await apiFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
      });
    } finally {
      localStorage.removeItem('backend_token');
    }
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('backend_token');
    if (!token) return null;
    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/me`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Habits
  getHabits: async (status = 'active', dateStr = null) => {
    let url = `${API_BASE_URL}/habits?status=${status}`;
    if (dateStr) url += `&date=${dateStr}`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Failed to fetch habits');
    return await res.json();
  },

  createHabit: async (habitData) => {
    const payload = {
      name: habitData.name,
      description: habitData.description || '',
      startDate: habitData.startDate,
      endDate: habitData.endDate || null,
      goal: habitData.goal || 1,
      frequency: (habitData.repeat || 'DAILY').toUpperCase(),
      color: habitData.color || 'blue',
      category: habitData.category || 'General',
      reminderTime: habitData.reminderTime || null,
      status: (habitData.status || 'ACTIVE').toUpperCase(),
      labelNames: habitData.labels || [],
    };
    const res = await apiFetch(`${API_BASE_URL}/habits`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to create habit');
    }
    return data;
  },

  updateHabit: async (id, habitData) => {
    const payload = {
      name: habitData.name,
      description: habitData.description || '',
      startDate: habitData.startDate,
      endDate: habitData.endDate || null,
      goal: habitData.goal || 1,
      frequency: (habitData.repeat || 'DAILY').toUpperCase(),
      color: habitData.color || 'blue',
      category: habitData.category || 'General',
      reminderTime: habitData.reminderTime || null,
      status: (habitData.status || 'ACTIVE').toUpperCase(),
      labelNames: habitData.labels || [],
    };
    const res = await apiFetch(`${API_BASE_URL}/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to update habit');
    }
    return data;
  },

  archiveHabit: async (id) => {
    const res = await apiFetch(`${API_BASE_URL}/habits/${id}/archive`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to archive habit');
    return await res.json();
  },

  unarchiveHabit: async (id) => {
    const res = await apiFetch(`${API_BASE_URL}/habits/${id}/unarchive`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to unarchive habit');
    return await res.json();
  },

  trashHabit: async (id) => {
    const res = await apiFetch(`${API_BASE_URL}/habits/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to move habit to trash');
    return await res.json();
  },

  // Completions
  getAllCompletions: async () => {
    const res = await apiFetch(`${API_BASE_URL}/completions`);
    if (!res.ok) return [];
    return await res.json();
  },

  toggleCompletion: async (habitId, dateStr) => {
    const res = await apiFetch(`${API_BASE_URL}/habits/${habitId}/completions/${dateStr}`, {
      method: 'PUT',
      body: JSON.stringify({ toggle: true }),
    });
    if (!res.ok) throw new Error('Failed to toggle completion');
    return await res.json();
  },

  recordCompletion: async (habitId, dateStr, count = 1) => {
    const res = await apiFetch(`${API_BASE_URL}/habits/${habitId}/completions/${dateStr}`, {
      method: 'PUT',
      body: JSON.stringify({ count }),
    });
    if (!res.ok) throw new Error('Failed to record completion');
    return await res.json();
  },

  undoCompletion: async (habitId, dateStr) => {
    const res = await apiFetch(`${API_BASE_URL}/habits/${habitId}/completions/${dateStr}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to undo completion');
    return await res.json();
  },

  // Dashboard Stats
  getStats: async (dateStr) => {
    let url = `${API_BASE_URL}/dashboard/stats`;
    if (dateStr) url += `?date=${dateStr}`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Failed to fetch statistics');
    return await res.json();
  },

  // Labels
  getLabels: async () => {
    const res = await apiFetch(`${API_BASE_URL}/labels`);
    if (!res.ok) return [];
    return await res.json();
  },

  createLabel: async (name, color = '#0d9488') => {
    const res = await apiFetch(`${API_BASE_URL}/labels`, {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to create label');
    return data;
  },

  deleteLabel: async (id) => {
    const res = await apiFetch(`${API_BASE_URL}/labels/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete label');
    return await res.json();
  },

  // Trash
  getTrash: async () => {
    const res = await apiFetch(`${API_BASE_URL}/trash`);
    if (!res.ok) return [];
    return await res.json();
  },

  restoreTrash: async (id) => {
    const res = await apiFetch(`${API_BASE_URL}/trash/${id}/restore`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to restore habit');
    return await res.json();
  },

  permanentDelete: async (id) => {
    const res = await apiFetch(`${API_BASE_URL}/trash/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete habit permanently');
    return await res.json();
  },

  emptyTrash: async () => {
    const res = await apiFetch(`${API_BASE_URL}/trash/empty`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to empty trash');
    return await res.json();
  },

  // CSV Export
  exportCsv: async () => {
    const res = await apiFetch(`${API_BASE_URL}/habits/export/csv`);
    if (!res.ok) throw new Error('Failed to export CSV');
    return await res.blob();
  },

  // Challenges
  getChallenges: async () => {
    const res = await apiFetch(`${API_BASE_URL}/challenges`);
    if (!res.ok) return [];
    return await res.json();
  },

  createChallenge: async (challengeData) => {
    const res = await apiFetch(`${API_BASE_URL}/challenges`, {
      method: 'POST',
      body: JSON.stringify(challengeData),
    });
    if (!res.ok) throw new Error('Failed to create challenge');
    return await res.json();
  },

  updateChallenge: async (id, data) => {
    const res = await apiFetch(`${API_BASE_URL}/challenges/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update challenge');
    return await res.json();
  },

  deleteChallenge: async (id) => {
    const res = await apiFetch(`${API_BASE_URL}/challenges/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete challenge');
    return await res.json();
  },

  // Pomodoro
  getPomodoro: async () => {
    const res = await apiFetch(`${API_BASE_URL}/pomodoro`);
    if (!res.ok) return { sessions: [], todayCount: 0, todayMinutes: 0 };
    return await res.json();
  },

  createPomodoro: async (sessionData) => {
    const res = await apiFetch(`${API_BASE_URL}/pomodoro`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
    if (!res.ok) throw new Error('Failed to log pomodoro session');
    return await res.json();
  },
};
