package com.coffeehut.Wang.service;
import com.coffeehut.model.OrderItem;

import java.time.LocalDateTime;
import java.util.List;

public class ReorderRequest {

    private String customerName;
    private String customerPhone;
    private LocalDateTime pickupTime;
    private Double totalPrice;
    private List<OrderItem> items;

    // Getters & Setters
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public LocalDateTime getPickupTime() { return pickupTime; }
    public void setPickupTime(LocalDateTime pickupTime) { this.pickupTime = pickupTime; }

    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}