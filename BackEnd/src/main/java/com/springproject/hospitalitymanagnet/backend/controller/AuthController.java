package com.springproject.hospitalitymanagnet.backend.controller;

import com.springproject.hospitalitymanagnet.backend.dto.ApiResponse;
import com.springproject.hospitalitymanagnet.backend.dto.AuthDto;
import com.springproject.hospitalitymanagnet.backend.dto.RegisterDto;
import com.springproject.hospitalitymanagnet.backend.service.impl.AuthService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")

@CrossOrigin
public class AuthController {
  private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
  public ResponseEntity<ApiResponse> registerUser(@RequestBody RegisterDto registerDto) {
      return ResponseEntity.ok(
              new ApiResponse(
                      200,
                      "User registered successfully",
                                authService.register(registerDto)
              )
      );
  }

  @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody AuthDto authDto) {
      return ResponseEntity.ok(
              new ApiResponse(
                      200,
                      "ok",
                      authService.authenticate(authDto)
              )
      );
  }

}
