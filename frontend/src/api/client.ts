import { Habit, HabitLogEntry, HabitRequest } from '../types';

const BASE_URL = 'http://localhost:8082/api';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('ft_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore - no JSON body
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  async register(username: string, email: string, password: string) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    return handle<{ token: string; username: string }>(res);
  },

  async login(username: string, password: string) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handle<{ token: string; username: string }>(res);
  },

  async listHabits() {
    const res = await fetch(`${BASE_URL}/habits`, { headers: authHeaders() });
    return handle<Habit[]>(res);
  },

  async createHabit(payload: HabitRequest) {
    const res = await fetch(`${BASE_URL}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
    return handle<Habit>(res);
  },

  async updateHabit(id: number, payload: HabitRequest) {
    const res = await fetch(`${BASE_URL}/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
    return handle<Habit>(res);
  },

  async deleteHabit(id: number) {
    const res = await fetch(`${BASE_URL}/habits/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handle<void>(res);
  },

  async checkIn(id: number, date?: string) {
    const qs = date ? `?date=${date}` : '';
    const res = await fetch(`${BASE_URL}/habits/${id}/checkin${qs}`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handle<Habit>(res);
  },

  async undoCheckIn(id: number, date?: string) {
    const qs = date ? `?date=${date}` : '';
    const res = await fetch(`${BASE_URL}/habits/${id}/checkin${qs}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handle<Habit>(res);
  },

  async getLogs(id: number, start?: string, end?: string) {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/habits/${id}/logs${qs}`, { headers: authHeaders() });
    return handle<HabitLogEntry[]>(res);
  },
};
