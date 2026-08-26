package com.habittracker.repository;

import com.habittracker.model.Habit;
import com.habittracker.model.HabitLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HabitLogRepository extends JpaRepository<HabitLog, Long> {
    Optional<HabitLog> findByHabitAndLogDate(Habit habit, LocalDate logDate);
    List<HabitLog> findByHabitOrderByLogDateDesc(Habit habit);
    List<HabitLog> findByHabitAndLogDateBetween(Habit habit, LocalDate start, LocalDate end);
    void deleteByHabitAndLogDate(Habit habit, LocalDate logDate);
}
