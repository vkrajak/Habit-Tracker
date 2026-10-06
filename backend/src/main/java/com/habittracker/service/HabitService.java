package com.habittracker.service;

import com.habittracker.dto.HabitLogResponse;
import com.habittracker.dto.HabitRequest;
import com.habittracker.dto.HabitResponse;
import com.habittracker.exception.ApiException;
import com.habittracker.model.FrequencyType;
import com.habittracker.model.Habit;
import com.habittracker.model.HabitLog;
import com.habittracker.model.User;
import com.habittracker.repository.HabitLogRepository;
import com.habittracker.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final StreakService streakService;

    @Transactional
    public HabitResponse createHabit(User user, HabitRequest request) {
        validateFrequencyFields(request);

        Habit habit = Habit.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .frequencyType(request.getFrequencyType())
                .specificDays(request.getSpecificDays() == null ? java.util.Set.of() : request.getSpecificDays())
                .targetPerWeek(request.getTargetPerWeek())
                .colorHex(request.getColorHex() == null ? "#4A6741" : request.getColorHex())
                .icon(request.getIcon() == null ? "check" : request.getIcon())
                .build();

        habitRepository.save(habit);
        return toResponse(habit);
    }

    @Transactional(readOnly = true)
    public List<HabitResponse> listHabits(User user) {
        return habitRepository.findByUserAndActiveTrueOrderByCreatedAtAsc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public HabitResponse updateHabit(User user, Long habitId, HabitRequest request) {

        System.out.println("1. validateFrequencyFields");
        validateFrequencyFields(request);

        System.out.println("2. getOwnedHabit");
        Habit habit = getOwnedHabit(user, habitId);

        System.out.println("3. Updating habit: " + habit.getId());

        habit.setName(request.getName());
        habit.setDescription(request.getDescription());
        habit.setFrequencyType(request.getFrequencyType());

        habit.setSpecificDays(
                request.getSpecificDays() == null
                        ? new HashSet<>()
                        : new HashSet<>(request.getSpecificDays())
        );

        habit.setTargetPerWeek(request.getTargetPerWeek());

        if (request.getColorHex() != null) {
            habit.setColorHex(request.getColorHex());
        }

        if (request.getIcon() != null) {
            habit.setIcon(request.getIcon());
        }

        System.out.println("4. Saving habit");

        try {
            habitRepository.saveAndFlush(habit);
            System.out.println("5. SAVE AND FLUSH SUCCESS");
        } catch (Exception e) {
            System.out.println("========== UPDATE HABIT FAILED ==========");
            e.printStackTrace();
            System.out.println("=========================================");
            throw e;
        }

        System.out.println("6. Converting response");

        return toResponse(habit);
    }

    @Transactional
    public void deleteHabit(User user, Long habitId) {
        Habit habit = getOwnedHabit(user, habitId);
        habit.setActive(false); // soft delete - keeps history intact
        habitRepository.save(habit);
    }

    @Transactional
    public HabitResponse checkIn(User user, Long habitId, LocalDate date) {
        Habit habit = getOwnedHabit(user, habitId);
        LocalDate targetDate = date == null ? LocalDate.now() : date;

        HabitLog log = habitLogRepository.findByHabitAndLogDate(habit, targetDate)
                .orElse(HabitLog.builder().habit(habit).logDate(targetDate).build());
        log.setCompleted(true);
        habitLogRepository.save(log);

        return toResponse(habit);
    }

    @Transactional
    public HabitResponse undoCheckIn(User user, Long habitId, LocalDate date) {
        Habit habit = getOwnedHabit(user, habitId);
        LocalDate targetDate = date == null ? LocalDate.now() : date;
        habitLogRepository.deleteByHabitAndLogDate(habit, targetDate);
        return toResponse(habit);
    }

    @Transactional(readOnly = true)
    public List<HabitLogResponse> getLogs(User user, Long habitId, LocalDate start, LocalDate end) {
        Habit habit = getOwnedHabit(user, habitId);
        LocalDate rangeStart = start == null ? LocalDate.now().minusDays(89) : start;
        LocalDate rangeEnd = end == null ? LocalDate.now() : end;

        return habitLogRepository.findByHabitAndLogDateBetween(habit, rangeStart, rangeEnd)
                .stream()
                .map(l -> new HabitLogResponse(l.getLogDate(), l.isCompleted()))
                .toList();
    }

    private Habit getOwnedHabit(User user, Long habitId) {
        return habitRepository.findByIdAndUser(habitId, user)
                .orElseThrow(() -> new ApiException("Habit not found", HttpStatus.NOT_FOUND));
    }

    private void validateFrequencyFields(HabitRequest request) {
        if (request.getFrequencyType() == FrequencyType.SPECIFIC_DAYS
                && (request.getSpecificDays() == null || request.getSpecificDays().isEmpty())) {
            throw new ApiException("specificDays is required when frequencyType is SPECIFIC_DAYS", HttpStatus.BAD_REQUEST);
        }
        if (request.getFrequencyType() == FrequencyType.X_TIMES_PER_WEEK
                && (request.getTargetPerWeek() == null || request.getTargetPerWeek() < 1)) {
            throw new ApiException("targetPerWeek (>=1) is required when frequencyType is X_TIMES_PER_WEEK", HttpStatus.BAD_REQUEST);
        }
    }

    private HabitResponse toResponse(Habit habit) {
        boolean completedToday = habitLogRepository.findByHabitAndLogDate(habit, LocalDate.now())
                .map(HabitLog::isCompleted)
                .orElse(false);

        return HabitResponse.builder()
                .id(habit.getId())
                .name(habit.getName())
                .description(habit.getDescription())
                .frequencyType(habit.getFrequencyType())
                .specificDays(habit.getSpecificDays())
                .targetPerWeek(habit.getTargetPerWeek())
                .colorHex(habit.getColorHex())
                .icon(habit.getIcon())
                .completedToday(completedToday)
                .currentStreak(streakService.currentStreak(habit))
                .longestStreak(streakService.longestStreak(habit))
                .last30DaysCompletionRate(streakService.completionRateLastNDays(habit, 30))
                .build();
    }
}
