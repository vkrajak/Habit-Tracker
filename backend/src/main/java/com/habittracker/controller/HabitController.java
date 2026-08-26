package com.habittracker.controller;

import com.habittracker.dto.HabitLogResponse;
import com.habittracker.dto.HabitRequest;
import com.habittracker.dto.HabitResponse;
import com.habittracker.model.User;
import com.habittracker.repository.UserRepository;
import com.habittracker.service.HabitService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class HabitController {

    private final HabitService habitService;
    private final UserRepository userRepository;

    private User currentUser(Authentication auth) {
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in DB"));
    }

    @PostMapping
    public ResponseEntity<HabitResponse> create(Authentication auth, @Valid @RequestBody HabitRequest request) {
        return ResponseEntity.ok(habitService.createHabit(currentUser(auth), request));
    }

    @GetMapping
    public ResponseEntity<List<HabitResponse>> list(Authentication auth) {
        return ResponseEntity.ok(habitService.listHabits(currentUser(auth)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitResponse> update(Authentication auth, @PathVariable Long id,
                                                 @Valid @RequestBody HabitRequest request) {
        return ResponseEntity.ok(habitService.updateHabit(currentUser(auth), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
        habitService.deleteHabit(currentUser(auth), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/checkin")
    public ResponseEntity<HabitResponse> checkIn(Authentication auth, @PathVariable Long id,
                                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(habitService.checkIn(currentUser(auth), id, date));
    }

    @DeleteMapping("/{id}/checkin")
    public ResponseEntity<HabitResponse> undoCheckIn(Authentication auth, @PathVariable Long id,
                                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(habitService.undoCheckIn(currentUser(auth), id, date));
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<List<HabitLogResponse>> logs(Authentication auth, @PathVariable Long id,
                                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
                                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(habitService.getLogs(currentUser(auth), id, start, end));
    }
}
