package com.cloverinfotech.employeemanager.employee_service.service;

import com.cloverinfotech.employeemanager.employee_service.entity.Employee;
import com.cloverinfotech.employeemanager.employee_service.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private static final String UPLOAD_DIR = "uploads";

    public EmployeeServiceImpl(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
        new File(UPLOAD_DIR).mkdirs();
    }

    @Override
    public Employee createEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    @Override
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @Override
    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
    }

    @Override
    public Employee getEmployeeByEmail(String email) {
        if (email == null || email.isBlank()) return null;
        return employeeRepository.findByEmailIgnoreCase(email.trim()).orElse(null);
    }

    @Override
    public Employee updateEmployee(Long id, Employee updatedEmployee) {
        Employee existing = getEmployeeById(id);

        existing.setName(updatedEmployee.getName());
        existing.setRole(updatedEmployee.getRole());
        existing.setBirthdate(updatedEmployee.getBirthdate());
        existing.setGender(updatedEmployee.getGender());
        existing.setHobbies(updatedEmployee.getHobbies());
        existing.setAddress1(updatedEmployee.getAddress1());
        existing.setAddress2(updatedEmployee.getAddress2());
        existing.setCity(updatedEmployee.getCity());
        existing.setState(updatedEmployee.getState());
        existing.setPin(updatedEmployee.getPin());
        existing.setPan(updatedEmployee.getPan());
        if (updatedEmployee.getEmail() != null) {
            existing.setEmail(updatedEmployee.getEmail());
        }

        return employeeRepository.save(existing);
    }

    @Override
    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }

    // ================= FILE UPLOAD =================

    @Override
    public void saveProfilePicture(Long employeeId, MultipartFile file) {
        try {
            Employee employee = getEmployeeById(employeeId);

            String filename = "profile_" + employeeId + getExtension(file.getOriginalFilename());
            Path path = Paths.get(UPLOAD_DIR, filename);

            Files.write(path, file.getBytes());
            employee.setProfilePicturePath(filename);

            employeeRepository.save(employee);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save profile picture", e);
        }
    }

    @Override
    public void saveAddressProof(Long employeeId, MultipartFile file, String proofType) {
        try {
            Employee employee = getEmployeeById(employeeId);

            String filename = "address_proof_" + employeeId + getExtension(file.getOriginalFilename());
            Path path = Paths.get(UPLOAD_DIR, filename);

            Files.write(path, file.getBytes());

            employee.setAddressProofPath(filename);
            employee.setAddressProofType(proofType);
            employee.setAddressProofContentType(file.getContentType()); // 🔥 KEY FIX

            employeeRepository.save(employee);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save address proof", e);
        }
    }

    // ================= FILE DOWNLOAD =================

    @Override
    public byte[] getProfilePicture(Long employeeId) {
        try {
            Employee employee = getEmployeeById(employeeId);
            return Files.readAllBytes(Paths.get(UPLOAD_DIR, employee.getProfilePicturePath()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to load profile picture", e);
        }
    }

    @Override
    public byte[] getAddressProof(Long employeeId) {
        try {
            Employee employee = getEmployeeById(employeeId);
            return Files.readAllBytes(Paths.get(UPLOAD_DIR, employee.getAddressProofPath()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to load address proof", e);
        }
    }

    private String getExtension(String filename) {
        return filename.substring(filename.lastIndexOf('.'));
    }
}
