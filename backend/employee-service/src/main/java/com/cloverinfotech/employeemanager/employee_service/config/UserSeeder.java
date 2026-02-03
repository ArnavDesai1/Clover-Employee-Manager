package com.cloverinfotech.employeemanager.employee_service.config;

import com.cloverinfotech.employeemanager.employee_service.entity.User;
import com.cloverinfotech.employeemanager.employee_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class UserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String defaultEmail = "theelemental0@gmail.com";
        if (userRepository.findByEmailIgnoreCase(defaultEmail).isPresent()) {
            return;
        }
        User admin = new User();
        admin.setEmail(defaultEmail);
        admin.setPasswordHash(passwordEncoder.encode("GOKANO.com1"));
        admin.setRole("Admin");
        userRepository.save(admin);
    }
}
