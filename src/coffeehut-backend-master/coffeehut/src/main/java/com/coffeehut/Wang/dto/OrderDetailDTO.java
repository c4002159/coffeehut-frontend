package com.coffeehut.Wang.dto;
import com.coffeehut.model.Order;
import lombok.Data;
import java.util.List;

@Data
public class OrderDetailDTO {
    private Order order;
    private List<OrderItemWithName> items;

    @Data
    public static class OrderItemWithName {
        private Long id;
        private Long orderId;
        private Long itemId;
        private String name;
        private String size;
        private Integer quantity;
        private Double subtotal;
        private String customizations;   // 新增
    }
}