package com.coffeehut.sixZhangkaichen;
import com.coffeehut.model.Member;
import com.coffeehut.repository.MemberRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;
@Service
public class LoyaltyService {
    @Autowired
    private MemberRepository memberRepository;
    @Autowired
    private MemberOrderLinkRepository memberOrderLinkRepository;
    public Member register(String name, String email, String password) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Name cannot be empty");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email cannot be empty");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new RuntimeException("Password cannot be empty");
        }
        String cleanEmail = email.trim().toLowerCase();
        if (memberRepository.existsByEmail(cleanEmail)) {
            throw new RuntimeException("This email is already registered");
        }
        Member member = new Member();
        member.setName(name.trim());
        member.setEmail(cleanEmail);
        member.setPassword(password.trim());
        member.setTotalOrders(0);
        return memberRepository.save(member);
    }
    public Member login(String email, String password) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email cannot be empty");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new RuntimeException("Password cannot be empty");
        }
        String cleanEmail = email.trim().toLowerCase();
        Member member = memberRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        if (!member.getPassword().equals(password.trim())) {
            throw new RuntimeException("Wrong password");
        }
        return member;
    }
    public Member getMemberById(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found"));
    }
    public Member addOneOrder(Long id) {
        Member member = getMemberById(id);
        if (member.getTotalOrders() == null) {
            member.setTotalOrders(0);
        }
        member.setTotalOrders(member.getTotalOrders() + 1);
        return memberRepository.save(member);
    }
    public void saveOrderLink(Long memberId, Long orderId) {
        if (memberId == null || orderId == null) {
            return;
        }
        if (!memberRepository.existsById(memberId)) {
            return;
        }
        Optional<MemberOrderLink> oldLink = memberOrderLinkRepository.findByOrderId(orderId);
        if (oldLink.isPresent()) {
            return;
        }
        MemberOrderLink link = new MemberOrderLink();
        link.setMemberId(memberId);
        link.setOrderId(orderId);
        link.setCounted(false);
        memberOrderLinkRepository.save(link);
    }
    public void handleCollectedOrder(Long orderId) {
        Optional<MemberOrderLink> optionalLink = memberOrderLinkRepository.findByOrderId(orderId);
        if (optionalLink.isEmpty()) {
            return;
        }
        MemberOrderLink link = optionalLink.get();
        if (Boolean.TRUE.equals(link.getCounted())) {
            return;
        }
        Member member = getMemberById(link.getMemberId());
        if (member.getTotalOrders() == null) {
            member.setTotalOrders(0);
        }
        member.setTotalOrders(member.getTotalOrders() + 1);
        memberRepository.save(member);
        link.setCounted(true);
        memberOrderLinkRepository.save(link);
    }
}
