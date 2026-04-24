package com.coffeehut.oneMenu;

import com.coffeehut.model.Item;
import com.coffeehut.repository.ItemRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MenuService {

    @Autowired
    private ItemRepository itemRepository;

    @PostConstruct
    public void initData() {
        if (itemRepository.count() == 0) {
            itemRepository.save(createItem("Americano", 1.50, 2.00));
            itemRepository.save(createItem("Americano with Milk", 2.00, 2.50));
            itemRepository.save(createItem("Latte", 2.50, 3.00));
            itemRepository.save(createItem("Cappuccino", 2.50, 3.00));
            itemRepository.save(createItem("Hot Chocolate", 2.00, 2.50));
            itemRepository.save(createItem("Mocha", 2.50, 3.00));
            itemRepository.save(createItem("Mineral Water", 1.00, null));
        }
    }

    private Item createItem(String name, Double regular, Double large) {
        Item item = new Item();
        item.setName(name);
        item.setRegularPrice(regular);
        item.setLargePrice(large);
        item.setIsAvailable(true);
        return item;
    }

    public List<Item> getAvailableItems() {
        return itemRepository.findAll().stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsAvailable()))
                .collect(Collectors.toList());
    }
}