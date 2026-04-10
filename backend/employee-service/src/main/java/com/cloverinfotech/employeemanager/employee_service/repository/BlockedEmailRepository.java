package com.cloverinfotech.employeemanager.employee_service.repository;

import com.cloverinfotech.employeemanager.employee_service.entity.BlockedEmail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BlockedEmailRepository extends JpaRepository<BlockedEmail, Long> {
    Optional<BlockedEmail> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}

