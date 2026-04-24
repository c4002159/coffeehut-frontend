package com.coffeehut.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;

    private String customerPhone;

     @Column(unique = true)
    private String orderNumber;

    private LocalDateTime pickupTime;

    private Double totalPrice;

    private String status = "pending";

    private LocalDateTime createdAt = LocalDateTime.now();

    private Boolean isArchived = false;

    private String notes;
}
