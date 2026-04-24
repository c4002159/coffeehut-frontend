package com.coffeehut.fiveTrain;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/train")
@CrossOrigin(origins = "*")
public class TrainController {

    @Autowired
    private TrainService trainService;

    @GetMapping
    public List<Map<String, String>> getTrains(@RequestParam String station) {
        return trainService.getTrains(station);
    }
}