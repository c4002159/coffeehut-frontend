CREATE TABLE Menu (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(100) NOT NULL,
    price_regular DECIMAL(5, 2) NOT NULL,
    price_large DECIMAL(5, 2), -- 某些饮品可能没有大杯
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO Menu (item_name, price_regular, price_large) VALUES
('Americano', 1.50, 2.00),
('Americano with milk', 2.00, 2.50),
('Latte', 2.50, 3.00),
('Cappuccino', 2.50, 3.00),
('Hot Chocolate', 2.00, 2.50),
('Mocha', 2.50, 3.00),
('Mineral Water', 1.00, NULL);
