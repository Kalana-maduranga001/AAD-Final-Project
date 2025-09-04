package com.springproject.hospitalitymanagnet.backend.dto;

import lombok.Data;

@Data
public class RegisterDto {
    private String username;
    private String role;
    private String email;
    private String password;

    // No-argument constructor
    public RegisterDto() {
    }

    // All-argument constructor
    public RegisterDto(String username, String role, String email, String password) {
        this.username = username;
        this.role = role;
        this.email = email;
        this.password = password;
    }

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    // Optional: toString() method
    @Override
    public String toString() {
        return "RegisterDto{" +
                "username='" + username + '\'' +
                ", role='" + role + '\'' +
                ", email='" + email + '\'' +
                ", password='" + password + '\'' +
                '}';
    }
}
