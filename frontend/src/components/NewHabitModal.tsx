import { FormEvent, useState } from 'react';
import { DAYS_OF_WEEK, DayOfWeek, FrequencyType, Habit, HabitRequest } from '../types';

interface Props {
  initial?: Habit | null;
  onClose: () => void;
  onSave: (payload: HabitRequest, id?: number) => Promise<void>;
}

const COLORS = ['#4A6741', '#B9873A', '#5B7A99', '#A9432E', '#6B5B95', '#3C7A6B'];

export default function NewHabitModal({ initial, onClose, onSave }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(initial?.frequencyType ?? 'DAILY');
  const [specificDays, setSpecificDays] = useState<DayOfWeek[]>(initial?.specificDays ?? []);
  const [targetPerWeek, setTargetPerWeek] = useState(initial?.targetPerWeek ?? 3);
  const [colorHex, setColorHex] = useState(initial?.colorHex ?? COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: DayOfWeek) {
    setSpecificDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: HabitRequest = {
        name,
        description,
        frequencyType,
        colorHex,
        icon: 'check',
        specificDays: frequencyType === 'SPECIFIC_DAYS' ? specificDays : undefined,
        targetPerWeek: frequencyType === 'X_TIMES_PER_WEEK' ? targetPerWeek : undefined,
      };
      await onSave(payload, initial?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save habit');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className="display" style={{ fontSize: 20, marginBottom: 4 }}>
          {initial ? 'Edit habit' : 'Plant a new habit'}
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0, marginBottom: 20 }}>
          Small and specific beats big and vague.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={styles.label}>
            Name
            <input style={styles.input} value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Read 10 pages" autoFocus />
          </label>

          <label style={styles.label}>
            Description (optional)
            <input style={styles.input} value={description} onChange={e => setDescription(e.target.value)} placeholder="Why this habit matters" />
          </label>

          <label style={styles.label}>
            Frequency
            <select style={styles.input} value={frequencyType} onChange={e => setFrequencyType(e.target.value as FrequencyType)}>
              <option value="DAILY">Every day</option>
              <option value="WEEKDAYS">Weekdays only</option>
              <option value="SPECIFIC_DAYS">Specific days</option>
              <option value="X_TIMES_PER_WEEK">X times per week</option>
            </select>
          </label>

          {frequencyType === 'SPECIFIC_DAYS' && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DAYS_OF_WEEK.map(day => (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  style={{
                    ...styles.dayChip,
                    background: specificDays.includes(day) ? colorHex : 'var(--bg)',
                    color: specificDays.includes(day) ? '#fff' : 'var(--ink)',
                    borderColor: specificDays.includes(day) ? colorHex : 'var(--line)',
                  }}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {frequencyType === 'X_TIMES_PER_WEEK' && (
            <label style={styles.label}>
              Times per week
              <input
                type="number"
                min={1}
                max={7}
                style={styles.input}
                value={targetPerWeek}
                onChange={e => setTargetPerWeek(Number(e.target.value))}
              />
            </label>
          )}

          <label style={styles.label}>
            Color
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColorHex(c)}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', background: c,
                    border: colorHex === c ? '2px solid var(--ink)' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={styles.secondaryBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={styles.primaryBtn}>
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Plant habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(35,38,31,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 },
  modal: { width: 420, maxWidth: '100%', background: 'var(--paper)', borderRadius: 'var(--radius-lg)', padding: '28px 26px', boxShadow: '0 8px 30px rgba(35,38,31,0.15)' },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--muted)', fontWeight: 500 },
  input: { padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)' },
  dayChip: { padding: '6px 10px', borderRadius: 20, border: '1px solid', fontSize: 12.5, fontWeight: 600 },
  error: { color: 'var(--danger)', fontSize: 13, background: '#FBEAE5', padding: '8px 10px', borderRadius: 6 },
  secondaryBtn: { flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)', fontWeight: 600, fontSize: 14 },
  primaryBtn: { flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--moss)', color: '#fff', fontWeight: 600, fontSize: 14 },
};
