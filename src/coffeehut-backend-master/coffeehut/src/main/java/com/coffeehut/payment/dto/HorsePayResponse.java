package com.coffeehut.payment.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
@Data
public class HorsePayResponse {
    @JsonProperty("paymetSuccess")
    private PaymentSuccess paymetSuccess;
    @Data
    public static class PaymentSuccess {
        @JsonProperty("Status")
        private Boolean status;
        private String reason;
    }
}
