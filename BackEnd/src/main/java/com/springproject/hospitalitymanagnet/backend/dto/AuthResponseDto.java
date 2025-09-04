package com.springproject.hospitalitymanagnet.backend.dto;


public class AuthResponseDto {
    private String accessToken;

    // No-argument constructor
    public AuthResponseDto() {
    }

    // All-argument constructor
    public AuthResponseDto(String accessToken) {
        this.accessToken = accessToken;
    }

    // Getter for accessToken
    public String getAccessToken() {
        return accessToken;
    }

    // Setter for accessToken
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    // Optional: toString() method
    @Override
    public String toString() {
        return "AuthResponseDto{" +
                "accessToken='" + accessToken + '\'' +
                '}';
    }
}
