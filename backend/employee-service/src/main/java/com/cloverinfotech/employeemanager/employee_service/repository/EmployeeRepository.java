package com.cloverinfotech.employeemanager.employee_service.repository;

import com.cloverinfotech.employeemanager.employee_service.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    java.util.Optional<Employee> findByEmailIgnoreCase(String email);
}