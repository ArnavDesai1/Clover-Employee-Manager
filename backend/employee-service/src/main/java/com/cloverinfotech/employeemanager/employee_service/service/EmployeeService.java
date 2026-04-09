package com.cloverinfotech.employeemanager.employee_service.service;

import com.cloverinfotech.employeemanager.employee_service.entity.Employee;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface EmployeeService {

    Employee createEmployee(Employee employee);

    Employee createEmployee(Employee employee, boolean selfRegistration);

    List<Employee> getAllEmployees();

    List<Employee> getPendingEmployees();

    Employee getEmployeeById(Long id);

    /** Returns the employee with the given login email, or null if not found. */
    Employee getEmployeeByEmail(String email);

    Employee updateEmployee(Long id, Employee employee);

    Employee approveEmployee(Long id);

    void deleteEmployee(Long id);

    // File upload methods
    void saveProfilePicture(Long employeeId, MultipartFile file);

    void saveAddressProof(Long employeeId, MultipartFile file, String proofType);

    byte[] getProfilePicture(Long employeeId);

    byte[] getAddressProof(Long employeeId);
}
