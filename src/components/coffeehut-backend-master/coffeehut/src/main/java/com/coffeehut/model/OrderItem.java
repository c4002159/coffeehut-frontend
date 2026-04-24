package com.coffeehut.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;

    private Long itemId;

    private String name;

    private String size;

    private Integer quantity;

    private Double unitPrice;

    private Double subtotal;

    private String customizations;
}
