package com.coffeehut.payment.dto;

import lombok.Data;

@Data
public class PaymentPayRequest {
    private String customerID;
    private Double transactionAmount;
}
