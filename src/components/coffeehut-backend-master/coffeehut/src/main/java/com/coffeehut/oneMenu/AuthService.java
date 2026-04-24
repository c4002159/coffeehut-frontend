package com.coffeehut.oneMenu;

import com.coffeehut.model.Member;
import com.coffeehut.repository.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private MemberRepository memberRepository;

    public ResponseEntity<?> login(String email, String password) {
        Optional<Member> member = memberRepository.findByEmail(email);
        if (member.isEmpty() || !member.get().getPassword().equals(password)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }
        Member m = member.get();
        return ResponseEntity.ok(Map.of(
                "memberId", m.getId(),
                "name", m.getName(),
                "totalOrders", m.getTotalOrders()
        ));
    }

    public ResponseEntity<?> register(String name, String email, String password) {
        if (memberRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(400).body(Map.of("error", "Email already registered"));
        }
        Member member = new Member();
        member.setName(name);
        member.setEmail(email);
        member.setPassword(password);
        memberRepository.save(member);
        return ResponseEntity.ok(Map.of("message", "Registration successful"));
    }
}