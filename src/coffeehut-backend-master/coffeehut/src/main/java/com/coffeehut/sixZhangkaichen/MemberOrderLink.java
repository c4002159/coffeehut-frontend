package com.coffeehut.sixZhangkaichen;

import jakarta.persistence.*;
@Entity
@Table(name = "member_order_links")
public class MemberOrderLink {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long memberId;
    private Long orderId;
    private Boolean counted;
    public MemberOrderLink() {
    }
    public MemberOrderLink(Long memberId, Long orderId, Boolean counted) {
        this.memberId = memberId;
        this.orderId = orderId;
        this.counted = counted;
    }
    public Long getId() {
        return id;
    }
    public Long getMemberId() {
        return memberId;
    }
    public Long getOrderId() {
        return orderId;
    }
    public Boolean getCounted() {
        return counted;
    }
    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }
    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }
    public void setCounted(Boolean counted) {
        this.counted = counted;
    }
}