package com.habittracker.dto;

import com.habittracker.model.FrequencyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitResponse {
    private Long id;
    private String name;
    private String description;
    private FrequencyType frequencyType;
    private Set<DayOfWeek> specificDays;
    private Integer targetPerWeek;
    private String colorHex;
    private String icon;
    private boolean completedToday;
    private int currentStreak;
    private int longestStreak;
    private double last30DaysCompletionRate;
}
