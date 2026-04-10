package com.cloverinfotech.employeemanager.employee_service.service;

import com.cloverinfotech.employeemanager.employee_service.entity.BlockedEmail;
import com.cloverinfotech.employeemanager.employee_service.entity.PasswordResetToken;
import com.cloverinfotech.employeemanager.employee_service.entity.User;
import com.cloverinfotech.employeemanager.employee_service.repository.BlockedEmailRepository;
import com.cloverinfotech.employeemanager.employee_service.repository.PasswordResetTokenRepository;
import com.cloverinfotech.employeemanager.employee_service.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final int TOKEN_VALID_MINUTES = 60;
    private static final List<String> DEFAULT_BLOCKED_EMAILS = List.of(
            "arundange1612@gmail.com"
    );
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private final UserRepository userRepository;
    private final BlockedEmailRepository blockedEmailRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                       BlockedEmailRepository blockedEmailRepository,
                       PasswordResetTokenRepository tokenRepository,
                       EmailService emailService,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.blockedEmailRepository = blockedEmailRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        ensureDefaultBlockedEmails();
    }

    /**
     * Request password reset. Never reveals whether the email exists.
     * If user exists, creates token and sends email (when mail is configured).
     * Returns map with message and optional resetLink (for demo when mail not configured).
     */
    @Transactional
    public Map<String, String> forgotPassword(String email) {
        String normalized = (email != null) ? email.trim().toLowerCase() : "";
        String message = "If an account exists with this email, you'll receive reset instructions shortly.";
        if (normalized.isEmpty()) {
            return Map.of("success", "true", "message", message);
        }
        if (isBlocked(normalized)) {
            return Map.of("success", "true", "message", message);
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalized);
        if (userOpt.isEmpty()) {
            return Map.of("success", "true", "message", message);
        }

        tokenRepository.deleteByEmail(normalized);
        String token = UUID.randomUUID().toString().replace("-", "");
        PasswordResetToken prt = new PasswordResetToken();
        prt.setToken(token);
        prt.setEmail(normalized);
        prt.setExpiresAt(Instant.now().plusSeconds(TOKEN_VALID_MINUTES * 60L));
        tokenRepository.save(prt);
        boolean sent = emailService.sendPasswordResetEmail(normalized, token);
        if (sent) {
            return Map.of("success", "true", "message", message);
        }
        String resetLink = emailService.buildResetLink(token);
        return Map.of("success", "true", "message", message, "resetLink", resetLink);
    }

    /**
     * Reset password using token. Returns success or error message.
     */
    @Transactional
    public Map<String, Object> resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            return Map.of("success", false, "error", "Invalid or expired reset link.");
        }
        if (newPassword == null || newPassword.length() < 6) {
            return Map.of("success", false, "error", "Password must be at least 6 characters.");
        }

        Optional<PasswordResetToken> prtOpt = tokenRepository.findByToken(token.trim());
        if (prtOpt.isEmpty()) {
            return Map.of("success", false, "error", "Invalid or expired reset link.");
        }
        PasswordResetToken prt = prtOpt.get();
        if (prt.getExpiresAt().isBefore(Instant.now())) {
            tokenRepository.delete(prt);
            return Map.of("success", false, "error", "Reset link has expired. Request a new one.");
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(prt.getEmail());
        if (userOpt.isEmpty()) {
            tokenRepository.delete(prt);
            return Map.of("success", false, "error", "Account not found.");
        }
        User user = userOpt.get();
        if (isBlocked(user.getEmail())) {
            tokenRepository.delete(prt);
            return Map.of("success", false, "error", "This account has been blocked. Contact admin.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.delete(prt);
        return Map.of("success", true, "message", "Password updated. You can sign in with your new password.");
    }

    /**
     * Sign in with email and password. Returns user info and role if valid.
     */
    public Map<String, Object> signIn(String email, String password) {
        String normalized = (email != null) ? email.trim().toLowerCase() : "";
        if (normalized.isEmpty() || password == null) {
            return Map.of("success", false, "error", "Email and password are required.");
        }
        if (isBlocked(normalized)) {
            return Map.of("success", false, "error", "This account has been blocked. Contact admin.");
        }
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalized);
        if (userOpt.isEmpty()) {
            return Map.of("success", false, "error", "Invalid email or password.");
        }
        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return Map.of("success", false, "error", "Invalid email or password.");
        }
        String name = normalized.split("@")[0];
        if (name.length() > 0) {
            name = name.substring(0, 1).toUpperCase() + name.substring(1);
        }
        return Map.of(
            "success", true,
            "token", "jwt-placeholder",
            "user", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", name,
                "role", user.getRole(),
                "organization", "Clover Infotech"
            )
        );
    }

    public List<String> getBlockedEmails() {
        return blockedEmailRepository.findAll()
                .stream()
                .map(BlockedEmail::getEmail)
                .filter(e -> e != null && !e.isBlank())
                .map(e -> e.trim().toLowerCase())
                .sorted()
                .toList();
    }

    @Transactional
    public Map<String, Object> blockEmail(String email) {
        String normalized = normalizeEmail(email);
        if (normalized.isEmpty()) {
            return Map.of("success", false, "error", "Email is required.");
        }
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            return Map.of("success", false, "error", "Enter a valid email address.");
        }
        if (blockedEmailRepository.existsByEmailIgnoreCase(normalized)) {
            return Map.of("success", true, "message", "Email is already blocked.");
        }
        BlockedEmail blocked = new BlockedEmail();
        blocked.setEmail(normalized);
        blockedEmailRepository.save(blocked);
        return Map.of("success", true, "message", "Email blocked successfully.");
    }

    @Transactional
    public Map<String, Object> unblockEmail(String email) {
        String normalized = normalizeEmail(email);
        if (normalized.isEmpty()) {
            return Map.of("success", false, "error", "Email is required.");
        }
        Optional<BlockedEmail> blockedOpt = blockedEmailRepository.findByEmailIgnoreCase(normalized);
        if (blockedOpt.isPresent()) {
            blockedEmailRepository.delete(blockedOpt.get());
        }
        return Map.of("success", true, "message", "Email unblocked successfully.");
    }

    public Map<String, Object> checkBlocked(String email) {
        return Map.of("blocked", isBlocked(email));
    }

    private boolean isBlocked(String email) {
        String normalized = normalizeEmail(email);
        return !normalized.isEmpty() && blockedEmailRepository.existsByEmailIgnoreCase(normalized);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private void ensureDefaultBlockedEmails() {
        for (String email : DEFAULT_BLOCKED_EMAILS) {
            String normalized = normalizeEmail(email);
            if (!normalized.isEmpty() && !blockedEmailRepository.existsByEmailIgnoreCase(normalized)) {
                BlockedEmail blocked = new BlockedEmail();
                blocked.setEmail(normalized);
                blockedEmailRepository.save(blocked);
            }
        }
    }
}
