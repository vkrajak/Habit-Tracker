package com.habittracker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        System.out.println("=== JWT DEBUG ===");
        System.out.println("Bearer token received");

        try {
            String username = jwtUtil.extractUsername(token);

            System.out.println("Username extracted: " + username);

            if (username != null &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails userDetails =
                        userDetailsService.loadUserByUsername(username);

                System.out.println("User loaded: " + userDetails.getUsername());
                System.out.println("Authorities: " + userDetails.getAuthorities());

                boolean valid =
                        jwtUtil.isTokenValid(token, userDetails.getUsername());

                System.out.println("Token valid: " + valid);

                if (valid) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    SecurityContextHolder.getContext()
                            .setAuthentication(authToken);

                    System.out.println("Authentication SET!");
                } else {
                    System.out.println("!!! TOKEN VALIDATION FAILED !!!");
                }
            }

        } catch (Exception e) {
            System.out.println("!!! JWT ERROR !!!");
            e.printStackTrace();
        }

        System.out.println(
                "AUTH BEFORE CONTROLLER: " +
                        SecurityContextHolder.getContext().getAuthentication()
        );

        filterChain.doFilter(request, response);

//        String token = authHeader.substring(7);
//        String username;
//        try {
//            username = jwtUtil.extractUsername(token);
//        } catch (Exception e) {
//            filterChain.doFilter(request, response);
//            return;
//        }
//
//        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
//            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
//            if (jwtUtil.isTokenValid(token, userDetails.getUsername())) {
//                UsernamePasswordAuthenticationToken authToken =
//                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
//                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
//                SecurityContextHolder.getContext().setAuthentication(authToken);
//                System.out.println("USERNAME: " + username);
//                System.out.println("AUTHORITIES: " + userDetails.getAuthorities());
//                System.out.println("TOKEN VALID: " +
//                        jwtUtil.isTokenValid(token, userDetails.getUsername()));
//            }
//        }
//
//        System.out.println("URI: " + request.getRequestURI());
//        System.out.println("AUTH: " + SecurityContextHolder.getContext().getAuthentication());
//        filterChain.doFilter(request, response);
    }
}
