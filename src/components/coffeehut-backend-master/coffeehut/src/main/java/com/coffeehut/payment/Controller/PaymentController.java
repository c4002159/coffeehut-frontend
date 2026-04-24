package com.coffeehut.payment.Controller;

import com.coffeehut.payment.Service.PaymentService;
import com.coffeehut.payment.dto.HorsePayResponse;
import com.coffeehut.payment.dto.PaymentPayRequest;
import jakarta.annotation.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Resource
    private PaymentService paymentService;

    @PostMapping("/pay")
    public ResponseEntity<HorsePayResponse> pay(@RequestBody PaymentPayRequest request) {
        HorsePayResponse response = paymentService.processPayment(request);
        return ResponseEntity.ok(response);
    }
}
