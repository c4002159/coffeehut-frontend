package com.coffeehut.oneMenu;

import com.coffeehut.model.Item;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/menu")
@CrossOrigin(origins = "*")
public class MenuController {

    @Autowired
    private MenuService menuService;

    @GetMapping
    public List<Item> getMenu() {
        return menuService.getAvailableItems();
    }
}