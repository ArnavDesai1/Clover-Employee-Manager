package com.cloverinfotech.employeemanager.employee_service.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String role;

    // Ensures correct JSON <-> LocalDate handling
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "birthdate")
    private LocalDate birthdate;

    private String gender;

    @Column(length = 500)
    private String hobbies; // comma-separated

    // ===== Address =====
    @Column(name = "address1")
    private String address1;

    @Column(name = "address2")
    private String address2;

    private String city;
    private String state;

    @Column(length = 10)
    private String pin;

    // ===== Documents =====
    @Column(unique = true)
    private String pan;

    /** Login email – links employee record to auth user (e.g. for self-registration). */
    @Column(unique = true)
    private String email;

    @Column(name = "profile_picture_path")
    private String profilePicturePath;

    @Column(name = "address_proof_type")
    private String addressProofType;   // pdf / image

    @Column(name = "address_proof_path")
    private String addressProofPath;

    // ✅ REAL MIME TYPE (image/png, image/jpeg, application/pdf)
    @Column(name = "address_proof_content_type")
    private String addressProofContentType;

    @Column(name = "approval_status")
    private String approvalStatus = "APPROVED";

    @Column(name = "requested_role")
    private String requestedRole;

    // ===== Getters & Setters =====

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDate getBirthdate() {
        return birthdate;
    }

    public void setBirthdate(LocalDate birthdate) {
        this.birthdate = birthdate;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getHobbies() {
        return hobbies;
    }

    public void setHobbies(String hobbies) {
        this.hobbies = hobbies;
    }

    public String getAddress1() {
        return address1;
    }

    public void setAddress1(String address1) {
        this.address1 = address1;
    }

    public String getAddress2() {
        return address2;
    }

    public void setAddress2(String address2) {
        this.address2 = address2;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPin() {
        return pin;
    }

    public void setPin(String pin) {
        this.pin = pin;
    }

    public String getPan() {
        return pan;
    }

    public void setPan(String pan) {
        this.pan = pan;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getProfilePicturePath() {
        return profilePicturePath;
    }

    public void setProfilePicturePath(String profilePicturePath) {
        this.profilePicturePath = profilePicturePath;
    }

    public String getAddressProofType() {
        return addressProofType;
    }

    public void setAddressProofType(String addressProofType) {
        this.addressProofType = addressProofType;
    }

    public String getAddressProofPath() {
        return addressProofPath;
    }

    public void setAddressProofPath(String addressProofPath) {
        this.addressProofPath = addressProofPath;
    }

    public String getAddressProofContentType() {
        return addressProofContentType;
    }

    public void setAddressProofContentType(String addressProofContentType) {
        this.addressProofContentType = addressProofContentType;
    }

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getRequestedRole() {
        return requestedRole;
    }

    public void setRequestedRole(String requestedRole) {
        this.requestedRole = requestedRole;
    }
}
