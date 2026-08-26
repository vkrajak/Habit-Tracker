import React, { useMemo } from 'react';
import { Habit } from '../types';

interface Props {
  habits: Habit[];
  year: number;
  month: number; // 0-based
  logsByHabit: Record<number, Set<string>>;
}

const QUOTES = [
  '"The successful person makes a habit of doing what the failing person doesn’t like to do." — Thomas Edison',
  '"We are what we repeatedly do. Excellence, then, is not an act, but a habit." — Will Durant',
  '"Small daily improvements are the key to staggering long-term results." — Anonymous',
  '"You do not rise to the level of your goals. You fall to the level of your systems." — James Clear',
  '"Motivation gets you going, but discipline keeps you growing." — John C. Maxwell',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getRose(percent: number) {
  if (percent === 0) return '🪴';
  if (percent < 25) return '🌱';
  if (percent < 50) return '🥀';
  if (percent < 75) return '🌷';
  return '🌹';
}

function RoseBouquet({ count }: { count: number }) {
  if (count === 0) {
    return <div style={{ fontSize: 42 }}>🪴</div>;
  }

  const roses = Math.min(count, 31);

  return (
    <div
      style={{
        position: 'relative',
        width: 100,
        height: 100,
        margin: '0 auto',
      }}
    >
      {Array.from({ length: roses }).map((_, i) => {
        const angle = (360 / roses) * i;
        const radius = Math.min(28, 10 + roses * 0.8);

        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '35%',
              transform: `
                translate(-50%, -50%)
                rotate(${angle}deg)
                translateY(-${radius}px)
              `,
              fontSize: 18,
              filter:
                'drop-shadow(0 0 5px rgba(255,80,120,.8))',
            }}
          >
            🌹
          </span>
        );
      })}

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          textAlign: 'center',
          fontSize: 42,
        }}
      >
        🎀
      </div>
    </div>
  );
}

export default function MonthSummary({
  habits,
  year,
  month,
  logsByHabit,
}: Props) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const dayStats = useMemo(() => {
    const stats: {
      day: number;
      completed: number;
      notCompleted: number;
      pct: number;
    }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const iso = toISO(date);
      const isFuture = date > today;

      if (habits.length === 0 || isFuture) {
        stats.push({
          day,
          completed: 0,
          notCompleted: 0,
          pct: 0,
        });
        continue;
      }

      const completed = habits.filter(
        (h) => logsByHabit[h.id]?.has(iso)
      ).length;

      const notCompleted = habits.length - completed;

      stats.push({
        day,
        completed,
        notCompleted,
        pct: Math.round((completed / habits.length) * 100),
      });
    }

    return stats;
  }, [habits, logsByHabit, year, month, daysInMonth]);

 const fullyBloomedDays = useMemo(() => {
   return dayStats.filter((d) => d.pct >= 75).length;
 }, [dayStats]);

  const quote = QUOTES[(year * 12 + month) % QUOTES.length];

  return (
    <div style={styles.card}>
      <p style={styles.quote}>{quote}</p>

      <div style={styles.topRow}>
        <div style={styles.monthBox}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--muted)',
              letterSpacing: '0.05em',
            }}
          >
            VIEWING
          </div>

          <div className="display" style={styles.monthName}>
            {MONTH_NAMES[month]}
          </div>

          <div
            className="mono"
            style={{
              fontSize: 13,
              color: 'var(--muted)',
            }}
          >
            {year}
          </div>
        </div>

        <div style={styles.chartWrapper}>
          <div style={styles.axis}>
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          <div style={styles.chart}>
            <div style={styles.gridLine} />
            <div style={{ ...styles.gridLine, top: '25%' }} />
            <div style={{ ...styles.gridLine, top: '50%' }} />
            <div style={{ ...styles.gridLine, top: '75%' }} />

            {dayStats.map(({ day, pct }) => (
              <div
                key={day}
                style={styles.barCol}
                title={`Day ${day}: ${pct}%`}
              >
                {pct > 0 && (
                  <div
                    style={{
                      ...styles.bar,
                      height: `${pct}%`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.totalBox}>
          <RoseBouquet count={fullyBloomedDays} />

          <div
            style={{
              fontSize: 11,
              color: 'var(--muted)',
              textAlign: 'center',
              marginTop: 8,
              letterSpacing: '0.03em',
            }}
          >
            FULL BLOOM DAYS
          </div>

          <div
            className="mono"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--moss)',
            }}
          >
            {fullyBloomedDays}
          </div>

          <div
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              marginTop: 2,
              textAlign: 'center',
            }}
          >
            Days with ≥ 75% completion
          </div>
        </div>
      </div>

      <div style={styles.statsTable}>
        <div style={styles.statsCol}>
          <div style={styles.statsLabel}>&nbsp;</div>
          <div style={styles.statsRowLabel}>Completed</div>
          <div style={styles.statsRowLabel}>Not done</div>
          <div style={styles.statsRowLabel}>% done</div>
        </div>

        <div style={styles.statsScroll}>
          {dayStats.map(
            ({ day, completed, notCompleted, pct }) => {
              const scale = 0.7 + pct / 150;

              return (
                <div
                  key={day}
                  style={styles.statsDayCol}
                >
                  <div style={styles.statsLabel}>
                    <span
                      title={`Day ${day}: ${pct}% complete`}
                      style={{
                        display: 'inline-block',
                        transform: `scale(${scale})`,
                        opacity:
                          pct === 0
                            ? 0.45
                            : 0.8 + pct / 500,
                        filter:
                          pct >= 75
                            ? `drop-shadow(0 0 ${
                                pct / 12
                              }px rgba(255,80,120,0.8))`
                            : pct >= 50
                            ? `drop-shadow(0 0 ${
                                pct / 20
                              }px rgba(255,120,150,0.5))`
                            : 'none',
                        transition: 'all 0.3s ease',
                        fontSize: '18px',
                      }}
                    >
                      {getRose(pct)}
                    </span>
                  </div>

                  <div
                    className="mono"
                    style={styles.statsVal}
                  >
                    {completed}
                  </div>

                  <div
                    className="mono"
                    style={styles.statsVal}
                  >
                    {notCompleted}
                  </div>

                  <div
                    className="mono"
                    style={{
                      ...styles.statsVal,
                      color:
                        pct >= 70
                          ? 'var(--moss)'
                          : pct > 0
                          ? 'var(--gold)'
                          : 'var(--muted)',
                      fontWeight:
                        pct >= 75 ? 700 : 400,
                    }}
                  >
                    {pct}%
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--paper)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 22px',
    marginBottom: 20,
  },

  quote: {
    fontSize: 12.5,
    color: 'var(--muted)',
    fontStyle: 'italic',
    margin: '0 0 16px',
    textAlign: 'center',
  },

  topRow: {
    display: 'flex',
    gap: 18,
    alignItems: 'stretch',
    marginBottom: 18,
  },

  monthBox: {
    width: 140,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--moss-light)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 8px',
    textAlign: 'center',
  },

  monthName: {
    fontSize: 24,
    fontWeight: 600,
    color: 'var(--moss-dark)',
    lineHeight: 1.1,
    margin: '2px 0',
  },

chart: {
  flex: 1,
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-end',
  gap: 4,
  height: 170,
  padding: '8px 0',
  borderBottom: '2px solid #d5c6c9',
  overflowX: 'auto',
},

chartWrapper: {
  flex: 1,
  display: 'flex',
  gap: 8,
  alignItems: 'stretch',
},

axis: {
  width: 40,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  fontSize: 10,
  color: 'var(--muted)',
  paddingBottom: 2,
},

  barCol: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '100%',
    minWidth: 16,
    flex: 1,
  },

 bar: {
   width: '90%',
   background: '#C98A96',
   borderRadius: '2px 2px 0 0',
   transition: 'height 0.3s ease',
 },

 gridLine: {
   position: 'absolute',
   left: 0,
   right: 0,
   top: 0,
   borderTop: '1px solid rgba(201,138,150,.25)',
   pointerEvents: 'none',
 },

  totalBox: {
    width: 180,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--gold-light)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 8px',
  },

  statsTable: {
    display: 'flex',
    borderTop: '1px solid var(--line)',
    paddingTop: 10,
    overflowX: 'auto',
  },

  statsCol: {
    flexShrink: 0,
    width: 90,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  statsLabel: {
    fontSize: 10,
    textAlign: 'center',
    height: 24,
    lineHeight: '24px',
  },

  statsRowLabel: {
    fontSize: 10.5,
    color: 'var(--muted)',
    height: 16,
    lineHeight: '16px',
  },

  statsScroll: {
    display: 'flex',
    flex: 1,
    gap: 3,
  },

  statsDayCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignItems: 'center',
    minWidth: 24,
    flex: 1,
  },

  statsVal: {
    fontSize: 10,
    height: 16,
    lineHeight: '16px',
    color: 'var(--ink)',
  },
};