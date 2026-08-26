package com.habittracker.dto;

import com.habittracker.model.FrequencyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.DayOfWeek;
import java.util.Set;

@Data
public class HabitRequest {
    @NotBlank
    private String name;

    private String description;

    @NotNull
    private FrequencyType frequencyType;

    // only for SPECIFIC_DAYS
    private Set<DayOfWeek> specificDays;

    // only for X_TIMES_PER_WEEK
    private Integer targetPerWeek;

    private String colorHex;
    private String icon;
}
