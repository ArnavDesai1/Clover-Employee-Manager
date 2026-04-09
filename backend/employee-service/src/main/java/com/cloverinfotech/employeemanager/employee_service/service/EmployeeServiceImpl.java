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
import java.util.Locale;

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
        return createEmployee(employee, false);
    }

    @Override
    public Employee createEmployee(Employee employee, boolean selfRegistration) {
        normalize(employee);
        validateRequired(employee);
        validateUnique(employee, null);

        if (selfRegistration) {
            employee.setRole("Employee");
            employee.setApprovalStatus("PENDING");
        } else if (employee.getApprovalStatus() == null || employee.getApprovalStatus().isBlank()) {
            employee.setApprovalStatus("APPROVED");
        }
        return employeeRepository.save(employee);
    }

    @Override
    public List<Employee> getAllEmployees() {
        return employeeRepository.findByApprovalStatusIgnoreCase("APPROVED");
    }

    @Override
    public List<Employee> getPendingEmployees() {
        return employeeRepository.findByApprovalStatusIgnoreCase("PENDING");
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
        normalize(updatedEmployee);
        validateRequired(updatedEmployee);
        validateUnique(updatedEmployee, id);

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
        if (updatedEmployee.getApprovalStatus() != null && !updatedEmployee.getApprovalStatus().isBlank()) {
            existing.setApprovalStatus(updatedEmployee.getApprovalStatus());
        }

        return employeeRepository.save(existing);
    }

    @Override
    public Employee approveEmployee(Long id) {
        Employee employee = getEmployeeById(id);
        employee.setApprovalStatus("APPROVED");
        return employeeRepository.save(employee);
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

    private void normalize(Employee employee) {
        if (employee == null) {
            throw new IllegalArgumentException("Employee payload is required");
        }
        if (employee.getName() != null) employee.setName(employee.getName().trim());
        if (employee.getRole() != null) employee.setRole(employee.getRole().trim());
        if (employee.getCity() != null) employee.setCity(employee.getCity().trim());
        if (employee.getState() != null) employee.setState(employee.getState().trim());
        if (employee.getAddress1() != null) employee.setAddress1(employee.getAddress1().trim());
        if (employee.getAddress2() != null) employee.setAddress2(employee.getAddress2().trim());
        if (employee.getPin() != null) employee.setPin(employee.getPin().trim());
        if (employee.getPan() != null) employee.setPan(employee.getPan().trim().toUpperCase(Locale.ROOT));
        if (employee.getEmail() != null && !employee.getEmail().isBlank()) {
            employee.setEmail(employee.getEmail().trim().toLowerCase(Locale.ROOT));
        }
    }

    private void validateRequired(Employee employee) {
        if (isBlank(employee.getName())) throw new IllegalArgumentException("Name is required");
        if (isBlank(employee.getRole())) throw new IllegalArgumentException("Role is required");
        if (employee.getBirthdate() == null) throw new IllegalArgumentException("Birthdate is required");
        if (isBlank(employee.getGender())) throw new IllegalArgumentException("Gender is required");
        if (isBlank(employee.getAddress1())) throw new IllegalArgumentException("Address line 1 is required");
        if (isBlank(employee.getCity())) throw new IllegalArgumentException("City is required");
        if (isBlank(employee.getState())) throw new IllegalArgumentException("State is required");
        if (isBlank(employee.getPin())) throw new IllegalArgumentException("PIN code is required");
        if (isBlank(employee.getPan())) throw new IllegalArgumentException("PAN is required");
    }

    private void validateUnique(Employee employee, Long currentEmployeeId) {
        if (!isBlank(employee.getPan())) {
            employeeRepository.findByPanIgnoreCase(employee.getPan()).ifPresent(existing -> {
                if (currentEmployeeId == null || !existing.getId().equals(currentEmployeeId)) {
                    throw new IllegalArgumentException("PAN already exists");
                }
            });
        }
        if (!isBlank(employee.getEmail())) {
            employeeRepository.findByEmailIgnoreCase(employee.getEmail()).ifPresent(existing -> {
                if (currentEmployeeId == null || !existing.getId().equals(currentEmployeeId)) {
                    throw new IllegalArgumentException("Email already exists");
                }
            });
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
