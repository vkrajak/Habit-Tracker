package com.habittracker.service;

import com.habittracker.model.FrequencyType;
import com.habittracker.model.Habit;
import com.habittracker.model.HabitLog;
import com.habittracker.repository.HabitLogRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.IsoFields;
import java.util.*;

/**
 * Computes streaks on the fly from HabitLog rows rather than storing
 * denormalized streak counters. Simpler to keep correct for a personal project -
 * no risk of the stored streak drifting out of sync with the actual logs.
 */
@Service
public class StreakService {

    private static final int MAX_LOOKBACK_DAYS = 3650; // ~10 years safety cap

    private final HabitLogRepository habitLogRepository;

    public StreakService(HabitLogRepository habitLogRepository) {
        this.habitLogRepository = habitLogRepository;
    }

    public boolean isExpectedDay(Habit habit, LocalDate date) {
        return switch (habit.getFrequencyType()) {
            case DAILY -> true;
            case WEEKDAYS -> date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY;
            case SPECIFIC_DAYS -> habit.getSpecificDays().contains(date.getDayOfWeek());
            case X_TIMES_PER_WEEK -> true; // every day is eligible; target is weekly count
        };
    }

    public int currentStreak(Habit habit) {
        List<HabitLog> logs = habitLogRepository.findByHabitOrderByLogDateDesc(habit);
        if (logs.isEmpty()) return 0;

        if (habit.getFrequencyType() == FrequencyType.X_TIMES_PER_WEEK) {
            return currentStreakWeekly(habit, logs);
        }
        return currentStreakDayBased(habit, logs);
    }

    public int longestStreak(Habit habit) {
        List<HabitLog> logs = habitLogRepository.findByHabitOrderByLogDateDesc(habit);
        if (logs.isEmpty()) return 0;

        if (habit.getFrequencyType() == FrequencyType.X_TIMES_PER_WEEK) {
            return longestStreakWeekly(habit, logs);
        }
        return longestStreakDayBased(habit, logs);
    }

    public double completionRateLastNDays(Habit habit, int n) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(n - 1);
        List<HabitLog> logs = habitLogRepository.findByHabitAndLogDateBetween(habit, start, end);
        Set<LocalDate> completedDates = new HashSet<>();
        for (HabitLog log : logs) {
            if (log.isCompleted()) completedDates.add(log.getLogDate());
        }

        int expected = 0;
        int completed = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            if (isExpectedDay(habit, d)) {
                expected++;
                if (completedDates.contains(d)) completed++;
            }
        }
        if (habit.getFrequencyType() == FrequencyType.X_TIMES_PER_WEEK) {
            // approximate: just use overall completed / (weeks * target)
            long weeks = Math.max(1, n / 7);
            int target = habit.getTargetPerWeek() == null ? 1 : habit.getTargetPerWeek();
            expected = (int) (weeks * target);
            completed = completedDates.size();
        }
        return expected == 0 ? 0.0 : Math.min(1.0, (double) completed / expected) * 100.0;
    }

    // ---------- day-based (DAILY / WEEKDAYS / SPECIFIC_DAYS) ----------

    private int currentStreakDayBased(Habit habit, List<HabitLog> logsDesc) {
        Set<LocalDate> completedDates = completedDateSet(logsDesc);

        int streak = 0;
        LocalDate cursor = LocalDate.now();
        boolean firstDay = true;

        for (int i = 0; i < MAX_LOOKBACK_DAYS; i++) {
            if (!isExpectedDay(habit, cursor)) {
                cursor = cursor.minusDays(1);
                continue;
            }
            boolean done = completedDates.contains(cursor);
            if (done) {
                streak++;
            } else if (firstDay && cursor.isEqual(LocalDate.now())) {
                // today not completed yet - doesn't break the streak, just don't count it
            } else {
                break;
            }
            firstDay = false;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private int longestStreakDayBased(Habit habit, List<HabitLog> logsDesc) {
        Set<LocalDate> completedDates = completedDateSet(logsDesc);
        if (completedDates.isEmpty()) return 0;

        LocalDate earliest = Collections.min(completedDates);
        LocalDate latest = LocalDate.now();

        int longest = 0;
        int running = 0;
        for (LocalDate d = earliest; !d.isAfter(latest); d = d.plusDays(1)) {
            if (!isExpectedDay(habit, d)) continue;
            if (completedDates.contains(d)) {
                running++;
                longest = Math.max(longest, running);
            } else {
                running = 0;
            }
        }
        return longest;
    }

    private Set<LocalDate> completedDateSet(List<HabitLog> logs) {
        Set<LocalDate> set = new HashSet<>();
        for (HabitLog log : logs) {
            if (log.isCompleted()) set.add(log.getLogDate());
        }
        return set;
    }

    // ---------- weekly (X_TIMES_PER_WEEK) ----------

    private record WeekKey(int year, int week) {}

    private WeekKey weekKeyOf(LocalDate date) {
        return new WeekKey(date.get(IsoFields.WEEK_BASED_YEAR), date.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
    }

    private int currentStreakWeekly(Habit habit, List<HabitLog> logsDesc) {
        int target = habit.getTargetPerWeek() == null ? 1 : habit.getTargetPerWeek();
        Map<WeekKey, Integer> countsPerWeek = new HashMap<>();
        for (HabitLog log : logsDesc) {
            if (!log.isCompleted()) continue;
            WeekKey wk = weekKeyOf(log.getLogDate());
            countsPerWeek.merge(wk, 1, Integer::sum);
        }

        int streak = 0;
        LocalDate cursorWeekStart = LocalDate.now();
        boolean firstWeek = true;
        for (int i = 0; i < MAX_LOOKBACK_DAYS / 7; i++) {
            WeekKey wk = weekKeyOf(cursorWeekStart);
            int count = countsPerWeek.getOrDefault(wk, 0);
            if (count >= target) {
                streak++;
            } else if (firstWeek) {
                // current week still in progress - don't break streak yet, just don't count it
            } else {
                break;
            }
            firstWeek = false;
            cursorWeekStart = cursorWeekStart.minusWeeks(1);
        }
        return streak;
    }

    private int longestStreakWeekly(Habit habit, List<HabitLog> logsDesc) {
        int target = habit.getTargetPerWeek() == null ? 1 : habit.getTargetPerWeek();
        if (logsDesc.isEmpty()) return 0;

        Map<WeekKey, Integer> countsPerWeek = new TreeMap<>(Comparator.comparing(WeekKey::year).thenComparing(WeekKey::week));
        for (HabitLog log : logsDesc) {
            if (!log.isCompleted()) continue;
            WeekKey wk = weekKeyOf(log.getLogDate());
            countsPerWeek.merge(wk, 1, Integer::sum);
        }

        int longest = 0;
        int running = 0;
        WeekKey prevMet = null;
        for (Map.Entry<WeekKey, Integer> entry : countsPerWeek.entrySet()) {
            if (entry.getValue() >= target) {
                if (prevMet != null && isConsecutive(prevMet, entry.getKey())) {
                    running++;
                } else {
                    running = 1;
                }
                longest = Math.max(longest, running);
                prevMet = entry.getKey();
            }
        }
        return longest;
    }

    private boolean isConsecutive(WeekKey a, WeekKey b) {
        // rough check: b is exactly one ISO week after a
        LocalDate approxA = LocalDate.ofYearDay(a.year(), 4).plusWeeks(a.week() - 1);
        LocalDate approxB = LocalDate.ofYearDay(b.year(), 4).plusWeeks(b.week() - 1);
        return approxA.plusWeeks(1).equals(approxB);
    }
}
