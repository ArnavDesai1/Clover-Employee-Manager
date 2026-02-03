package com.cloverinfotech.employeemanager.employee_service.repository;

import com.cloverinfotech.employeemanager.employee_service.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.email = :email")
    void deleteByEmail(@Param("email") String email);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :instant")
    void deleteAllByExpiresAtBefore(@Param("instant") Instant instant);
}
