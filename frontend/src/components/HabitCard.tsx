import { useState } from 'react';
import { Habit } from '../types';
import Heatmap from './Heatmap';

interface Props {
  habit: Habit;
  onCheckIn: (id: number) => void;
  onUndo: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (habit: Habit) => void;
}

function frequencyLabel(habit: Habit): string {
  switch (habit.frequencyType) {
    case 'DAILY': return 'Every day';
    case 'WEEKDAYS': return 'Weekdays';
    case 'SPECIFIC_DAYS':
      return habit.specificDays.map(d => d.slice(0, 3)).join(' · ');
    case 'X_TIMES_PER_WEEK':
      return `${habit.targetPerWeek}x / week`;
  }
}

export default function HabitCard({ habit, onCheckIn, onUndo, onDelete, onEdit }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      if (habit.completedToday) {
        await onUndo(habit.id);
      } else {
        await onCheckIn(habit.id);
      }
      setRefreshKey(k => k + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={toggle}
            disabled={busy}
            aria-label={habit.completedToday ? 'Mark not done today' : 'Mark done today'}
            style={{
              ...styles.checkbox,
              background: habit.completedToday ? habit.colorHex : 'transparent',
              borderColor: habit.colorHex,
            }}
          >
            {habit.completedToday && <span style={styles.check}>✓</span>}
          </button>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{habit.name}</div>
            <div style={styles.meta}>{frequencyLabel(habit)}</div>
          </div>
        </div>

        <div style={styles.stats}>
          <div style={styles.stat}>
            <span className="mono" style={{ ...styles.statNum, color: 'var(--gold)' }}>{habit.currentStreak}</span>
            <span style={styles.statLabel}>streak</span>
          </div>
          <div style={styles.stat}>
            <span className="mono" style={styles.statNum}>{habit.longestStreak}</span>
            <span style={styles.statLabel}>best</span>
          </div>
          <div style={styles.stat}>
            <span className="mono" style={styles.statNum}>{Math.round(habit.last30DaysCompletionRate)}%</span>
            <span style={styles.statLabel}>30d</span>
          </div>
        </div>
      </div>

      <div style={styles.bottomRow}>
        <Heatmap habitId={habit.id} color={habit.colorHex} refreshKey={refreshKey} />
        <div style={styles.actions}>
          <button style={styles.linkBtn} onClick={() => onEdit(habit)}>Edit</button>
          <button style={{ ...styles.linkBtn, color: 'var(--danger)' }} onClick={() => onDelete(habit.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  checkbox: { width: 30, height: 30, borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  check: { color: '#fff', fontSize: 15, fontWeight: 700 },
  meta: { fontSize: 12.5, color: 'var(--muted)', marginTop: 2 },
  stats: { display: 'flex', gap: 18 },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 34 },
  statNum: { fontSize: 16, fontWeight: 600 },
  statLabel: { fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  bottomRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  actions: { display: 'flex', gap: 12 },
  linkBtn: { background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12.5, padding: 0 },
};
