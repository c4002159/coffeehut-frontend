package com.coffeehut.repository;
import com.coffeehut.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerNameIgnoreCase(String customerName);
    List<Order> findByIsArchivedFalse();
    List<Order> findByIsArchivedTrue();
    List<Order> findByIsArchivedTrueOrderByCreatedAtDesc();
}
