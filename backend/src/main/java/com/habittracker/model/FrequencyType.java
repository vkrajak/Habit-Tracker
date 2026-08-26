package com.habittracker.model;

public enum FrequencyType {
    DAILY,              // every day
    WEEKDAYS,           // Mon-Fri only
    SPECIFIC_DAYS,      // e.g. Mon, Wed, Fri - see Habit.specificDays
    X_TIMES_PER_WEEK    // e.g. 3 times a week, any days - see Habit.targetPerWeek
}
