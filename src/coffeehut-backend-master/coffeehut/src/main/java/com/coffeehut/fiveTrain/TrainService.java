package com.coffeehut.fiveTrain;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class TrainService {

    private List<Map<String, String>> cachedTrains = new ArrayList<>();
    private long lastFetchTime = 0;
    private static final long CACHE_DURATION = 60 * 1000; // 60秒缓存

    public List<Map<String, String>> getTrains(String station) {
        long now = System.currentTimeMillis();
        if (now - lastFetchTime < CACHE_DURATION && !cachedTrains.isEmpty()) {
            return cachedTrains;
        }

        // 调用真实 Network Rail API（需要注册获取 token）
        // 目前先返回模拟数据，方便开发测试
        cachedTrains = getMockTrains(station);
        lastFetchTime = now;
        return cachedTrains;
    }

    private List<Map<String, String>> getMockTrains(String station) {
        List<Map<String, String>> trains = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        LocalDateTime now = LocalDateTime.now();

        String[] origins = {"Newcastle", "Morpeth", "Edinburgh", "York"};
        String[] statuses = {"On Time", "On Time", "Delayed", "On Time", "Cancelled"};

        for (int i = 1; i <= 5; i++) {
            Map<String, String> train = new HashMap<>();
            LocalDateTime scheduled = now.plusMinutes(i * 12);
            LocalDateTime expected = statuses[i - 1].equals("Delayed")
                    ? scheduled.plusMinutes(8)
                    : scheduled;

            train.put("trainId", "NT" + String.format("%04d", i * 111));
            train.put("scheduledArrival", scheduled.format(fmt));
            train.put("expectedArrival", expected.format(fmt));
            train.put("status", statuses[i - 1]);
            train.put("origin", origins[i % origins.length]);
            trains.add(train);
        }
        return trains;
    }
}