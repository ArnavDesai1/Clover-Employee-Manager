package com.cloverinfotech.employeemanager.employee_service.controller;

import com.cloverinfotech.employeemanager.employee_service.entity.Employee;
import com.cloverinfotech.employeemanager.employee_service.service.EmployeeService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/employees")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    // ================= CRUD =================

    @PostMapping
    public Employee createEmployee(@RequestBody Employee employee) {
        return employeeService.createEmployee(employee);
    }

    @GetMapping
    public List<Employee> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    @GetMapping("/{id}")
    public Employee getEmployeeById(@PathVariable Long id) {
        return employeeService.getEmployeeById(id);
    }

    /** For employee portal: get the employee record linked to this login email. */
    @GetMapping("/by-email")
    public ResponseEntity<Employee> getEmployeeByEmail(@RequestParam String email) {
        Employee employee = employeeService.getEmployeeByEmail(email);
        if (employee == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(employee);
    }

    @PutMapping("/{id}")
    public Employee updateEmployee(@PathVariable Long id, @RequestBody Employee employee) {
        return employeeService.updateEmployee(id, employee);
    }

    @DeleteMapping("/{id}")
    public void deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
    }

    // ================= UPLOAD =================

    @PostMapping("/{id}/profile-picture")
    public ResponseEntity<String> uploadProfilePicture(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        employeeService.saveProfilePicture(id, file);
        return ResponseEntity.ok("Profile picture uploaded successfully");
    }

    @PostMapping("/{id}/address-proof")
    public ResponseEntity<String> uploadAddressProof(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("proofType") String proofType) {

        employeeService.saveAddressProof(id, file, proofType);
        return ResponseEntity.ok("Address proof uploaded successfully");
    }

    // ================= DOWNLOAD =================

    @GetMapping("/{id}/profile-picture")
    public ResponseEntity<byte[]> downloadProfilePicture(@PathVariable Long id) {

        Employee employee = employeeService.getEmployeeById(id);
        byte[] file = employeeService.getProfilePicture(id);

        MediaType mediaType = MediaType.IMAGE_JPEG;
        if (employee.getProfilePicturePath() != null) {
            if (employee.getProfilePicturePath().endsWith(".png")) {
                mediaType = MediaType.IMAGE_PNG;
            }
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .contentType(mediaType)
                .body(file);
    }

    @GetMapping("/{id}/address-proof")
    public ResponseEntity<byte[]> downloadAddressProof(@PathVariable Long id) {

        Employee employee = employeeService.getEmployeeById(id);
        byte[] file = employeeService.getAddressProof(id);

        String contentType = employee.getAddressProofContentType();
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

        if (contentType != null) {
            mediaType = MediaType.parseMediaType(contentType);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .contentType(mediaType)
                .body(file);
    }
}
