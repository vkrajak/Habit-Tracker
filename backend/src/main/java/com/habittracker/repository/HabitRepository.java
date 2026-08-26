package com.habittracker.repository;

import com.habittracker.model.Habit;
import com.habittracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HabitRepository extends JpaRepository<Habit, Long> {
    List<Habit> findByUserAndActiveTrueOrderByCreatedAtAsc(User user);
    Optional<Habit> findByIdAndUser(Long id, User user);
}
