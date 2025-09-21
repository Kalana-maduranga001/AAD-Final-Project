package com.springproject.hospitalitymanagnet.backend.service.impl;

import com.springproject.hospitalitymanagnet.backend.dto.PaymentResultDTO;
import com.springproject.hospitalitymanagnet.backend.dto.BookingApiRequestDTO.Payment;
import com.springproject.hospitalitymanagnet.backend.repository.PaymentRepository;
 // if you use alias import adjust accordingly
import com.springproject.hospitalitymanagnet.backend.service.PaymentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentServiceImpl(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional
    public PaymentResultDTO processPayment(Payment paymentInfo, double amount) {
        String providerId = "DEMO-" + UUID.randomUUID();

        String last4 = null;
        String cardBrand = null;
        if (paymentInfo != null && paymentInfo.getToken() != null) {
            String tok = paymentInfo.getToken().replaceAll("\\D+", "");
            if (tok.length() >= 4) last4 = tok.substring(tok.length() - 4);
        }

        // build & save entity (use your Payment entity class)
        com.springproject.hospitalitymanagnet.backend.entity.Payment p = com.springproject.hospitalitymanagnet.backend.entity.Payment.builder()
                .paymentProviderId(providerId)
                .provider("demo")
                .method(paymentInfo != null && paymentInfo.getToken() != null ? "card" : "unknown")
                .status("SUCCESS")
                .amount(BigDecimal.valueOf(amount))
                .currency("USD")                 // persisted currency
                .cardLast4(last4)
                .cardBrand(cardBrand)
                .createdAt(LocalDateTime.now())
                .build();

        paymentRepository.save(p);

        PaymentResultDTO res = new PaymentResultDTO();
        res.setPaymentId(providerId);
        res.setStatus("SUCCESS");
        res.setProvider("demo");
        res.setMethod(p.getMethod());
        res.setCardLast4(p.getCardLast4());
        res.setCardBrand(p.getCardBrand());
        res.setMessage("Demo payment processed successfully");
        res.setCurrency("USD");               // <-- IMPORTANT: populate currency

        return res;
    }
}
