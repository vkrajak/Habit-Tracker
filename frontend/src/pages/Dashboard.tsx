import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Habit, HabitRequest } from '../types';
import HabitCard from '../components/HabitCard';
import NewHabitModal from '../components/NewHabitModal';
import MonthGrid from '../components/MonthGrid';
import MonthSummary from '../components/MonthSummary';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const { username, logout } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Shared month/year for the grid + summary panel, so they always agree on what's shown.
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  // Logs for the selected month, fetched once here and handed down to both
  // MonthSummary and MonthGrid so they stay in sync and we don't double-fetch.
  const [logsByHabit, setLogsByHabit] = useState<Record<number, Set<string>>>({});

  async function refresh() {
    try {
      const data = await api.listHabits();
      setHabits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load habits');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (habits.length === 0) { setLogsByHabit({}); return; }
    const monthStart = toISO(new Date(year, month, 1));
    const monthEnd = toISO(new Date(year, month + 1, 0));

    Promise.all(
      habits.map(h => api.getLogs(h.id, monthStart, monthEnd).then(logs => [h.id, logs] as const))
    ).then(results => {
      const next: Record<number, Set<string>> = {};
      for (const [habitId, logs] of results) {
        next[habitId] = new Set(logs.filter(l => l.completed).map(l => l.date));
      }
      setLogsByHabit(next);
    }).catch(() => {});
  }, [habits, year, month]);

  async function handleCheckIn(id: number) {
    const updated = await api.checkIn(id);
    setHabits(prev => prev.map(h => h.id === id ? updated : h));
  }

  async function handleUndo(id: number) {
    const updated = await api.undoCheckIn(id);
    setHabits(prev => prev.map(h => h.id === id ? updated : h));
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this habit? Its history will be kept but it will no longer show here.')) return;
    await api.deleteHabit(id);
    setHabits(prev => prev.filter(h => h.id !== id));
  }

  async function handleSave(payload: HabitRequest, id?: number) {
    if (id) {
      const updated = await api.updateHabit(id, payload);
      setHabits(prev => prev.map(h => h.id === id ? updated : h));
    } else {
      const created = await api.createHabit(payload);
      setHabits(prev => [...prev, created]);
    }
  }

  async function handleGridToggle(habitId: number, date: string, nowCompleted: boolean) {
    // optimistic update so the grid/summary respond instantly
    setLogsByHabit(prev => {
      const next = { ...prev };
      const set = new Set(next[habitId] ?? []);
      if (nowCompleted) set.add(date); else set.delete(date);
      next[habitId] = set;
      return next;
    });

    try {
      if (nowCompleted) {
        await api.checkIn(habitId, date);
      } else {
        await api.undoCheckIn(habitId, date);
      }
      // resync streak/completion numbers shown elsewhere (e.g. List view)
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update that day');
    }
  }

  const doneToday = habits.filter(h => h.completedToday).length;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={styles.mark}>fn</span>
          <h1 className="display" style={{ fontSize: 22 }}>Fieldnotes</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{username}</span>
          <button onClick={logout} style={styles.logoutBtn}>Sign out</button>
        </div>
      </header>

      <main style={{ ...styles.main, maxWidth: view === 'grid' ? 1200 : 760 }}>
        <div style={styles.summaryRow}>
          <div>
            <h2 className="display" style={{ fontSize: 26 }}>Today's rows</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 0' }}>
              {habits.length === 0 ? 'Nothing planted yet.' : `${doneToday} of ${habits.length} tended today`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {view === 'grid' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={month} onChange={e => setMonth(Number(e.target.value))} style={styles.select}>
                  {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(Number(e.target.value))} style={styles.select}>
                  {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
            <div style={styles.viewToggle}>
              <button
                onClick={() => setView('grid')}
                style={{ ...styles.toggleBtn, ...(view === 'grid' ? styles.toggleBtnActive : {}) }}
              >
                Grid
              </button>
              <button
                onClick={() => setView('list')}
                style={{ ...styles.toggleBtn, ...(view === 'list' ? styles.toggleBtnActive : {}) }}
              >
                List
              </button>
            </div>
            <button style={styles.primaryBtn} onClick={() => { setEditing(null); setModalOpen(true); }}>
              + New habit
            </button>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Loading…</p>
        ) : habits.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: 15 }}>Your field is empty.</p>
            <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Plant your first habit to start a streak.</p>
          </div>
        ) : view === 'grid' ? (
          <>
            <MonthSummary habits={habits} year={year} month={month} logsByHabit={logsByHabit} />
            <MonthGrid habits={habits} year={year} month={month} logsByHabit={logsByHabit} onToggleDay={handleGridToggle} />
          </>
        ) : (
          <div style={styles.list}>
            {habits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onCheckIn={handleCheckIn}
                onUndo={handleUndo}
                onDelete={handleDelete}
                onEdit={h => { setEditing(h); setModalOpen(true); }}
              />
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <NewHabitModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' },
  mark: { width: 28, height: 28, borderRadius: 7, background: 'var(--moss)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 },
  logoutBtn: { background: 'none', border: '1px solid var(--line)', borderRadius: 6, padding: '6px 12px', fontSize: 13, color: 'var(--ink)' },
  main: { maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' },
  summaryRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' },
  select: { padding: '9px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: 13 },
  primaryBtn: { padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--moss)', color: '#fff', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' },
  viewToggle: { display: 'flex', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' },
  toggleBtn: { padding: '9px 14px', border: 'none', background: 'var(--paper)', color: 'var(--muted)', fontSize: 13, fontWeight: 600 },
  toggleBtnActive: { background: 'var(--moss)', color: '#fff' },
  list: { display: 'flex', flexDirection: 'column', gap: 14 },
  empty: { border: '1px dashed var(--line)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' },
  error: { color: 'var(--danger)', fontSize: 13, background: '#FBEAE5', padding: '10px 12px', borderRadius: 6, marginBottom: 20 },
};