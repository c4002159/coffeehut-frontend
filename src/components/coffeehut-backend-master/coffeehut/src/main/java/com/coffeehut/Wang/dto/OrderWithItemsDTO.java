package com.coffeehut.Wang.dto;

import com.coffeehut.model.Order;
import lombok.Data;
import java.util.List;

@Data
public class OrderWithItemsDTO {
    private Order order;
    private List<OrderItemSummary> items;

    @Data
    public static class OrderItemSummary {
        private String name;
        private Integer quantity;
        private String size;
        private String customizations;   // 新增
    }
}