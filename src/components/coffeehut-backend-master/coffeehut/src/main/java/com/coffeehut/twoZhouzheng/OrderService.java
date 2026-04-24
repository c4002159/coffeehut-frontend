package com.coffeehut.twoZhouzheng;

import com.coffeehut.model.Order;
import com.coffeehut.model.OrderItem;
import com.coffeehut.repository.OrderItemRepository;
import com.coffeehut.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.stream.Collectors;
import com.coffeehut.Wang.dto.OrderWithItemsDTO;
import com.coffeehut.Wang.dto.OrderDetailDTO;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    // 获取单个订单
    public Order getOrderById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    // 按客户名查订单列表
    public List<Order> getOrdersByCustomer(String name) {
        return orderRepository.findByCustomerNameIgnoreCase(name);
    }

    // 获取订单商品
    public List<OrderItem> getOrderItems(Long orderId) {
        return orderItemRepository.findByOrderId(orderId);
    }

    // Reorder — 复制一个历史订单重新下单
    public Order createReorder(ReorderRequest request) {
        // 1. 创建新订单，复制客户信息
        Order newOrder = new Order();
        newOrder.setCustomerName(request.getCustomerName());
        newOrder.setCustomerPhone(request.getCustomerPhone());
        newOrder.setTotalPrice(request.getTotalPrice());
        newOrder.setStatus("pending");
        newOrder.setIsArchived(false);
        newOrder.setCreatedAt(LocalDateTime.now());

        // 2. 取餐时间：用请求里传来的，没有就默认 +10分钟
        if (request.getPickupTime() != null) {
            newOrder.setPickupTime(request.getPickupTime());
        } else {
            newOrder.setPickupTime(LocalDateTime.now().plusMinutes(10));
        }

        // 3. 保存订单
        Order saved = orderRepository.save(newOrder);
        saved.setOrderNumber(generateOrderNumber());
        saved = orderRepository.save(saved);

        // 4. 保存订单商品
        if (request.getItems() != null) {
            for (OrderItem item : request.getItems()) {
                OrderItem newItem = new OrderItem();
                newItem.setOrderId(saved.getId());
                newItem.setItemId(item.getItemId());
                newItem.setSize(item.getSize());
                newItem.setQuantity(item.getQuantity());
                newItem.setSubtotal(item.getSubtotal());
                orderItemRepository.save(newItem);
            }
        }

        return saved;
    }


    // 获取所有活跃订单（含商品）
    public List<OrderWithItemsDTO> getActiveOrdersWithItems() {
        List<Order> orders = orderRepository.findByIsArchivedFalse();
        return orders.stream().map(order -> {
            OrderWithItemsDTO dto = new OrderWithItemsDTO();
            dto.setOrder(order);
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            List<OrderWithItemsDTO.OrderItemSummary> summaries = items.stream().map(item -> {
                OrderWithItemsDTO.OrderItemSummary s = new OrderWithItemsDTO.OrderItemSummary();
                s.setName("Item #" + item.getItemId());
                s.setQuantity(item.getQuantity());
                s.setSize(item.getSize());
                return s;
            }).collect(Collectors.toList());
            dto.setItems(summaries);
            return dto;
        }).collect(Collectors.toList());
    }

    // 获取订单详情
    public OrderDetailDTO getOrderDetail(Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return null;
        OrderDetailDTO dto = new OrderDetailDTO();
        dto.setOrder(order);
        List<OrderItem> items = orderItemRepository.findByOrderId(id);
        List<OrderDetailDTO.OrderItemWithName> details = items.stream().map(item -> {
            OrderDetailDTO.OrderItemWithName d = new OrderDetailDTO.OrderItemWithName();
            d.setId(item.getId());
            d.setOrderId(item.getOrderId());
            d.setItemId(item.getItemId());
            d.setName("Item #" + item.getItemId());
            d.setSize(item.getSize());
            d.setQuantity(item.getQuantity());
            d.setSubtotal(item.getSubtotal());
            return d;
        }).collect(Collectors.toList());
        dto.setItems(details);
        return dto;
    }

    // 更新订单状态
    public Order updateOrderStatus(Long id, String status) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return null;
        order.setStatus(status);
        if ("collected".equals(status) || "cancelled".equals(status)) {
            order.setIsArchived(true);
        }
        return orderRepository.save(order);
    }

    // 获取归档订单（按日期分组）
    public Map<String, List<Order>> getArchivedOrdersGrouped() {
        List<Order> archived = orderRepository.findByIsArchivedTrueOrderByCreatedAtDesc();
        Map<String, List<Order>> grouped = new LinkedHashMap<>();
        LocalDateTime now = LocalDateTime.now();
        for (Order order : archived) {
            String group;
            if (order.getCreatedAt().toLocalDate().equals(now.toLocalDate())) {
                group = "TODAY";
            } else if (order.getCreatedAt().toLocalDate().equals(now.minusDays(1).toLocalDate())) {
                group = "YESTERDAY";
            } else {
                group = "LAST 7 DAYS";
            }
            grouped.computeIfAbsent(group, k -> new ArrayList<>()).add(order);
        }
        return grouped;
    }

    // 搜索归档订单
    public List<Order> searchArchivedOrders(String keyword) {
        return orderRepository.findByIsArchivedTrueOrderByCreatedAtDesc().stream()
            .filter(o -> (o.getCustomerName() != null && o.getCustomerName().contains(keyword))
                || (o.getOrderNumber() != null && o.getOrderNumber().contains(keyword)))
            .collect(Collectors.toList());
    }

    // 取消订单
    public Order cancelOrder(Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return null;
        order.setStatus("cancelled");
        order.setIsArchived(true);
        return orderRepository.save(order);
    }

    // 生成订单号：CHut-YYYYMMDD-6位随机大写字母数字
    private String generateOrderNumber() {
        String date = java.time.LocalDateTime.now()
            .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        java.util.Random random = new java.util.Random();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return "CHut-" + date + "-" + sb;
    }

    // 添加备注
    public Order addNote(Long id, String note) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return null;
        order.setNotes(note);
        return orderRepository.save(order);
    }
}
