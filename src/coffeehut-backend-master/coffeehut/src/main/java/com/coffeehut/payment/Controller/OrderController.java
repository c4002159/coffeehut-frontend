package com.coffeehut.payment.Controller;

import com.coffeehut.model.Order;
import com.coffeehut.model.OrderItem;
import com.coffeehut.repository.OrderItemRepository;
import com.coffeehut.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.Resource;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Resource
    private OrderRepository orderRepository;

    @Resource
    private OrderItemRepository orderItemRepository;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody CreateOrderRequest request) {
        Order order = new Order();
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        LocalDateTime pickup = request.getPickupTime() != null && !request.getPickupTime().isEmpty()
                ? LocalDateTime.parse(request.getPickupTime().replace("Z", ""))
                : LocalDateTime.now().plusMinutes(15);
        order.setPickupTime(pickup);
        order.setTotalPrice(request.getTotalPrice());
        order.setStatus("pending");
        order = orderRepository.save(order);
        order.setOrderNumber(generateOrderNumber(order.getId()));
        order = orderRepository.save(order);

        for (OrderItemDto item : request.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrderId(order.getId());
            orderItem.setItemId(item.getItemId() != null ? item.getItemId() : item.getId());
            orderItem.setName(item.getName());
            orderItem.setSize(item.getSize() != null ? item.getSize() : "Regular");
            int qty = item.getQuantity() != null ? item.getQuantity() : 1;
            orderItem.setQuantity(qty);
            orderItem.setUnitPrice(item.getPrice());
            double sub = item.getSubtotal() != null
                ? item.getSubtotal()
                : (item.getPrice() != null ? item.getPrice() * qty : 0.0);
            orderItem.setSubtotal(sub);
            orderItemRepository.save(orderItem);
        }

        return ResponseEntity.ok(Map.of("id", order.getId(), "orderId", order.getId(), "orderNumber", order.getOrderNumber()));
    }

    private String generateOrderNumber(Long id) {
        String date = java.time.LocalDateTime.now()
            .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        java.util.Random random = new java.util.Random(id * 31L + System.nanoTime());
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return "CHut-" + date + "-" + sb;
    }

    @lombok.Data
    public static class CreateOrderRequest {
        private String customerName;
        private String customerPhone;
        private String pickupTime;
        private Double totalPrice;
        private List<OrderItemDto> items;
    }

    @lombok.Data
    public static class OrderItemDto {
        private Long id;        // frontend cart item id
        private Long itemId;    // explicit itemId if provided
        private String name;
        private String size;
        private Integer quantity;
        private Double price;   // unit price
        private Double subtotal;
    }
}
