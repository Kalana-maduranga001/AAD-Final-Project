package com.springproject.hospitalitymanagnet.backend.repository;

import com.springproject.hospitalitymanagnet.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Payment findByPaymentProviderId(String providerId);
}
