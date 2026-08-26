import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { HabitLogEntry } from '../types';

interface Props {
  habitId: number;
  color: string;
  refreshKey: number; // bump this after a check-in to refetch
}

const WEEKS = 13; // ~ one quarter, the "growing season" for this habit's row

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Heatmap({ habitId, color, refreshKey }: Props) {
  const [logs, setLogs] = useState<HabitLogEntry[]>([]);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - WEEKS * 7 + 1);
    api.getLogs(habitId, toISODate(start), toISODate(end)).then(setLogs).catch(() => {});
  }, [habitId, refreshKey]);

  const completedSet = new Set(logs.filter(l => l.completed).map(l => l.date));

  const cells: { date: string; completed: boolean; isToday: boolean }[] = [];
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - WEEKS * 7 + 1);
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = toISODate(d);
    cells.push({ date: iso, completed: completedSet.has(iso), isToday: iso === toISODate(today) });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${WEEKS}, 1fr)`, gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, 1fr)', gap: 3 }}>
      {cells.map(cell => (
        <div
          key={cell.date}
          title={cell.date}
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: cell.completed ? color : 'var(--line)',
            outline: cell.isToday ? `1.5px solid ${color}` : 'none',
            outlineOffset: 1,
          }}
        />
      ))}
    </div>
  );
}
