package com.coffeehut.Wang;

import com.coffeehut.Wang.dto.NoteRequest;
import com.coffeehut.Wang.dto.OrderDetailDTO;
import com.coffeehut.Wang.dto.OrderWithItemsDTO;
import com.coffeehut.model.Order;
import com.coffeehut.twoZhouzheng.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/orders")
@CrossOrigin(origins = "*")
public class StaffOrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping("/active")
    public List<OrderWithItemsDTO> getActiveOrders() {
        return orderService.getActiveOrdersWithItems();
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDetailDTO> getOrderDetail(@PathVariable Long id) {
        OrderDetailDTO detail = orderService.getOrderDetail(id);
        return detail != null ? ResponseEntity.ok(detail) : ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Order updated = orderService.updateOrderStatus(id, body.get("status"));
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @GetMapping("/archived")
    public Map<String, List<Order>> getArchivedOrders() {
        return orderService.getArchivedOrdersGrouped();
    }

    @GetMapping("/archived/search")
    public List<Order> searchArchivedOrders(@RequestParam String keyword) {
        return orderService.searchArchivedOrders(keyword);
    }

    // 新增端点
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        Order cancelled = orderService.cancelOrder(id);
        if (cancelled != null) {
            return ResponseEntity.ok(cancelled);
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Order cannot be cancelled"));
    }

    @PatchMapping("/{id}/note")
    public ResponseEntity<Order> addNote(@PathVariable Long id, @RequestBody NoteRequest noteRequest) {
        Order updated = orderService.addNote(id, noteRequest.getNote());
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }
}