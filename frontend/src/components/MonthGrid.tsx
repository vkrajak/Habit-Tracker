import { Fragment, useMemo } from 'react';
import { Habit } from '../types';

interface Props {
  habits: Habit[];
  year: number;
  month: number; // 0-based
  logsByHabit: Record<number, Set<string>>;
  onToggleDay: (habitId: number, date: string, nowCompleted: boolean) => void;
}

const WEEK_COLORS = ['#A9432E', '#B9873A', '#4A6E86', '#6B5B95', '#4A6741', '#7A7460'];
const WEEK_TINTS  = ['#F6E6E2', '#F3E7CF', '#E4EDF2', '#EAE5F1', '#E7EEE2', '#EDECE4'];
const DAY_LETTERS = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildWeeks(year: number, month0: number): (Date | null)[][] {
  const firstDay = new Date(year, month0, 1);
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7; // Monday = 0

  const weeks: (Date | null)[][] = [];
  let current: (Date | null)[] = new Array(weekdayIndex(firstDay)).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    current.push(new Date(year, month0, day));
    if (current.length === 7) {
      weeks.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    while (current.length < 7) current.push(null);
    weeks.push(current);
  }
  return weeks;
}

export default function MonthGrid({ habits, year, month, logsByHabit, onToggleDay }: Props) {
  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);
  const totalCols = weeks.length * 7;

  function isCompleted(habitId: number, date: Date) {
    return logsByHabit[habitId]?.has(toISO(date)) ?? false;
  }

  function handleClick(habitId: number, date: Date) {
    const iso = toISO(date);
    const wasCompleted = logsByHabit[habitId]?.has(iso) ?? false;
    onToggleDay(habitId, iso, !wasCompleted);
  }

  function trackedDaysSoFar(): number {
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    if (isCurrentMonth) return today.getDate();
    const isPast = year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth());
    return isPast ? daysInMonth : 0;
  }

  const tracked = trackedDaysSoFar();

  function completionPct(habitId: number): number {
    if (tracked === 0) return 0;
    const done = logsByHabit[habitId]?.size ?? 0;
    return Math.round((done / tracked) * 100);
  }

  const dailyFraction: (number | null)[] = [];
  weeks.forEach(week => {
    week.forEach(date => {
      if (!date) { dailyFraction.push(null); return; }
      if (habits.length === 0) { dailyFraction.push(0); return; }
      const doneCount = habits.filter(h => isCompleted(h.id, date)).length;
      dailyFraction.push(doneCount / habits.length);
    });
  });

  const gridTemplateColumns = `170px repeat(${totalCols}, minmax(20px, 1fr))`;

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--paper)' }}>
      <div style={{ display: 'grid', gridTemplateColumns, width: '100%' }}>
        <div style={{ ...headerCell, background: 'var(--bg)' }} />
        {weeks.map((_, wi) => (
          <div
            key={`wk-${wi}`}
            style={{ ...headerCell, gridColumn: `span 7`, background: WEEK_COLORS[wi % WEEK_COLORS.length], color: '#fff', fontWeight: 600 }}
          >
            Week {wi + 1}
          </div>
        ))}

        <div style={{ ...headerCell, background: 'var(--bg)', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
          Habit
        </div>
        {weeks.map((week, wi) =>
          week.map((date, di) => (
            <div key={`d-${wi}-${di}`} style={{ ...dayHeaderCell, background: WEEK_TINTS[wi % WEEK_TINTS.length] }}>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{DAY_LETTERS[di]}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{date ? date.getDate() : ''}</span>
            </div>
          ))
        )}

        {habits.map(habit => (
          <Fragment key={habit.id}>
            <div style={{ ...labelCell }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{habit.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tracked}d · {completionPct(habit.id)}%
              </div>
            </div>
            {weeks.map((week, wi) =>
              week.map((date, di) => {
                if (!date) return <div key={`c-${habit.id}-${wi}-${di}`} style={cellWrap} />;
                const done = isCompleted(habit.id, date);
                const isFuture = date > new Date();
                return (
                  <div key={`c-${habit.id}-${wi}-${di}`} style={cellWrap}>
                    <button
                      disabled={isFuture}
                      onClick={() => handleClick(habit.id, date)}
                      title={toISO(date)}
                      style={{
                        width: 15, height: 15, borderRadius: 3,
                        border: `1.5px solid ${habit.colorHex}`,
                        background: done ? habit.colorHex : 'transparent',
                        opacity: isFuture ? 0.35 : 1,
                        cursor: isFuture ? 'default' : 'pointer',
                      }}
                    />
                  </div>
                );
              })
            )}
          </Fragment>
        ))}

        <div style={{ ...labelCell, display: 'flex', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Daily Progress</span>
        </div>
        {dailyFraction.map((frac, i) => (
          <div key={`bar-${i}`} style={{ ...cellWrap, alignItems: 'flex-end', height: 44 }}>
            {frac !== null && (
              <div
                style={{
                  width: 10,
                  height: Math.max(3, frac * 36),
                  borderRadius: 2,
                  background: frac >= 0.7 ? 'var(--moss)' : frac > 0 ? 'var(--gold)' : 'var(--line)',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const headerCell: React.CSSProperties = {
  padding: '8px 6px', textAlign: 'center', fontSize: 12, borderBottom: '1px solid var(--line)',
};

const dayHeaderCell: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: '6px 2px', borderBottom: '1px solid var(--line)', gap: 1,
};

const labelCell: React.CSSProperties = {
  padding: '10px 10px', borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line)',
  display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'sticky', left: 0,
  background: 'var(--paper)', overflow: 'hidden',
};

const cellWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--line)',
  padding: '4px 1px', minWidth: 0,
};