export type FrequencyType = 'DAILY' | 'WEEKDAYS' | 'SPECIFIC_DAYS' | 'X_TIMES_PER_WEEK';

export const DAYS_OF_WEEK = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
] as const;
export type DayOfWeek = typeof DAYS_OF_WEEK[number];

export interface Habit {
  id: number;
  name: string;
  description?: string;
  frequencyType: FrequencyType;
  specificDays: DayOfWeek[];
  targetPerWeek?: number;
  colorHex: string;
  icon: string;
  completedToday: boolean;
  currentStreak: number;
  longestStreak: number;
  last30DaysCompletionRate: number;
}

export interface HabitLogEntry {
  date: string;
  completed: boolean;
}

export interface HabitRequest {
  name: string;
  description?: string;
  frequencyType: FrequencyType;
  specificDays?: DayOfWeek[];
  targetPerWeek?: number;
  colorHex?: string;
  icon?: string;
}
