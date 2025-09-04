package com.springproject.hospitalitymanagnet.backend.service;

import com.springproject.hospitalitymanagnet.backend.dto.AuthDto;
import com.springproject.hospitalitymanagnet.backend.dto.AuthResponseDto;
import com.springproject.hospitalitymanagnet.backend.dto.RegisterDto;
import com.springproject.hospitalitymanagnet.backend.entity.Role;
import com.springproject.hospitalitymanagnet.backend.entity.User;
import com.springproject.hospitalitymanagnet.backend.repository.UserRepository;
import com.springproject.hospitalitymanagnet.backend.util.JWTUtil;


import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service

public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JWTUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponseDto authenticate(AuthDto authDto) {
        //Validate credentials
      User user =  userRepository.findByUsername(authDto.getUsername())
                .orElseThrow(() -> new RuntimeException("Username not found"));
       //check password
        if(!passwordEncoder.matches(
                authDto.getPassword(),
                user.getPassword())){
             throw new BadCredentialsException("Invalid credentials");
        }
        //generate token
       String token = jwtUtil.generateToken(authDto.getUsername());
        return new AuthResponseDto(token);
    }
    public String register(RegisterDto registerDto) {
        if(userRepository.findByUsername(registerDto.getUsername()).isPresent()){
            throw new RuntimeException("Username already exists");
        }
        User user = new User();
        user.setUsername(registerDto.getUsername());
        user.setEmail(registerDto.getEmail());
        user.setPassword(passwordEncoder.encode(registerDto.getPassword()));
        user.setRole(Role.valueOf(registerDto.getRole()));

        userRepository.save(user);
        return "user Registration Successfully";
    }

}
