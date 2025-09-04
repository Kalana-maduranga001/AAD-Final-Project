package com.springproject.hospitalitymanagnet.backend.repository;

import com.springproject.hospitalitymanagnet.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}
