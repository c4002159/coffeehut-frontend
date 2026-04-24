package com.coffeehut.payment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
public class HorsePayRequest {
    private String storeID = "Team99";
    private String customerID;
    private String date;
    private String time;
    private String timeZone = "GMT";
    private Double transactionAmount;
    private String currencyCode = "GBP";

    @JsonProperty("forcePaymentSatusReturnType")
    private Boolean forcePaymentStatusReturnType;
}
