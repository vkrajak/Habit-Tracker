package com.habittracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class HabitLogResponse {
    private LocalDate date;
    private boolean completed;
}
