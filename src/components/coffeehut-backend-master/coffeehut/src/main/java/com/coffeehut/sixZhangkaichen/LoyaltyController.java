package com.coffeehut.sixZhangkaichen;
import com.coffeehut.model.Member;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
@RestController
@RequestMapping("/api/loyalty")
@CrossOrigin(origins = "*")
public class LoyaltyController {
    @Autowired
    private LoyaltyService loyaltyService;
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            String name = body.get("name");
            String email = body.get("email");
            String password = body.get("password");

            Member member = loyaltyService.register(name, email, password);

            return ResponseEntity.ok(buildMemberResponse(member, "Register success"));
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String password = body.get("password");

            Member member = loyaltyService.login(email, password);

            return ResponseEntity.ok(buildMemberResponse(member, "Login success"));
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    @GetMapping("/{id}")
    public ResponseEntity<?> getMember(@PathVariable Long id) {
        try {
            Member member = loyaltyService.getMemberById(id);
            return ResponseEntity.ok(buildMemberResponse(member, "Load success"));
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    @PostMapping("/{id}/add-order")
    public ResponseEntity<?> addOrder(@PathVariable Long id) {
        try {
            Member member = loyaltyService.addOneOrder(id);
            return ResponseEntity.ok(buildMemberResponse(member, "Order count updated"));
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    private Map<String, Object> buildMemberResponse(Member member, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("message", message);
        result.put("memberId", member.getId());
        result.put("name", member.getName());
        result.put("email", member.getEmail());
        result.put("totalOrders", member.getTotalOrders());
        return result;
    }
}