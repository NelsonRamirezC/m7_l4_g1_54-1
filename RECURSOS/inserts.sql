-- =======================================================
-- 1. INSERCIÓN DE 5 USUARIOS
-- =======================================================
INSERT INTO usuarios (nombre, apellido, rut, correo, password) VALUES
('Valentina', 'Rojas', '18.452.193-4', 'valentina.rojas@gmail.com', 'pass1234'),
('Matías', 'González', '19.821.430-1', 'matias.gonzalez@hotmail.com', 'claveMatias'),
('Camila', 'Silva', '17.294.618-K', 'camila.silva@outlook.com', 'camila2026'),
('Diego', 'Fuentes', '16.745.321-8', 'diego.fuentes@gmail.com', 'diegoFpass'),
('Francisca', 'Morales', '20.103.874-5', 'francisca.m@yahoo.com', 'fran999') RETURNING *;


-- =======================================================
-- 2. INSERCIÓN DE 15 PRODUCTOS (POSTRES)
-- =======================================================
INSERT INTO productos (nombre, descripcion, precio, stock) VALUES
('Tiramisú Tradicional', 'Bizcocho de soletilla embebido en café con crema mascarpone y cacao', 4500.00, 25),
('Cheesecake de Frutos Rojos', 'Base de galleta crujiente con crema de queso y coulis artesanal de frutos rojos', 5200.00, 18),
('Torta Tres Leches', 'Bizcocho esponjoso bañado en mezcla de tres leches y merengue tostado', 4000.00, 30),
('Pie de Limón', 'Masa quebrada rellena de crema de limón y coronada con merengue italiano', 3800.00, 20),
('Brownie con Nuez', 'Brownie húmedo de chocolate amargo con trozos de nuez tostada', 2500.00, 45),
('Mousse de Maracuyá', 'Postre ligero y aireado con pulpa natural de maracuyá', 3200.00, 15),
('Torta Selva Negra', 'Capas de bizcocho de chocolate, crema chantilly, cerezas y virutas de chocolate', 5800.00, 12),
('Volcán de Chocolate', 'Bizcocho tibio de cacao relleno de chocolate líquido', 3900.00, 16),
('Crepes Suzette', 'Crepes finas flambeadas en mantequilla, azúcar, jugo y licor de naranja', 4200.00, 10),
('Crème Brûlée', 'Crema suave a base de vainilla con una capa superior de azúcar caramelizado crujiente', 4600.00, 22),
('Alfajor Artesanal de Maicena', 'Relleno de abundante dulce de leche y borde de coco rallado', 1500.00, 60),
('Panna Cotta de Frutilla', 'Crema cocida italiana acompañada de reducción casera de frutillas', 3500.00, 14),
('Tartaleta de Frutas de la Estación', 'Masa dulce rellena de crema pastelera y fruta fresca variada', 3700.00, 19),
('Torta Cuatro Cuartos / Queque Marmolado', 'Bizcocho tradicional de vainilla y chocolate ideal para la once', 2800.00, 25),
('Copa Helada Sundae Deluxe', 'Helado artesanal de vainilla y chocolate con salsa de caramelo y crocante', 3400.00, 20) RETURNING *;


-- =======================================================
-- 3. INSERCIÓN DE 10 VENTAS (ENCABEZADOS)
-- =======================================================
-- Los totales coinciden exactamente con la suma de sus detalles
INSERT INTO ventas (id, usuario_id, fecha_venta, total) VALUES
(1, 1, '2026-08-01 15:30:00', 14200.00), -- Valentina
(2, 2, '2026-08-02 11:15:00', 8800.00),  -- Matías
(3, 3, '2026-08-03 17:45:00', 12100.00), -- Camila
(4, 4, '2026-08-04 18:20:00', 9200.00),  -- Diego
(5, 5, '2026-08-05 13:00:00', 11300.00), -- Francisca
(6, 1, '2026-08-07 19:10:00', 7400.00),  -- Valentina
(7, 2, '2026-08-08 16:00:00', 11600.00), -- Matías
(8, 3, '2026-08-09 20:30:00', 7000.00),  -- Camila
(9, 4, '2026-08-10 14:15:00', 11400.00), -- Diego
(10, 5, '2026-08-11 18:00:00', 8400.00) RETURNING *; -- Francisca

-- Ajustar secuencia del serial de ventas tras inserción explícita de IDs
SELECT setval('ventas_id_seq', (SELECT MAX(id) FROM ventas));


-- =======================================================
-- 4. INSERCIÓN DEL DETALLE DE CADA VENTA
-- =======================================================
-- Nota: La columna "subtotal" no se incluye aquí porque se calcula automáticamente
INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES
-- Venta 1 (Total: 14200.00)
(1, 1, 2, 4500.00), -- 2 Tiramisú ($9000)
(1, 2, 1, 5200.00), -- 1 Cheesecake ($5200)

-- Venta 2 (Total: 8800.00)
(2, 5, 2, 2500.00), -- 2 Brownies ($5000)
(2, 4, 1, 3800.00), -- 1 Pie de Limón ($3800)

-- Venta 3 (Total: 12100.00)
(3, 7, 1, 5800.00), -- 1 Selva Negra ($5800)
(3, 11, 3, 1500.00),-- 3 Alfajores ($4500)
(3, 6, 1, 3200.00), -- 1 Mousse Maracuyá ($3200)

-- Venta 4 (Total: 9200.00)
(4, 10, 2, 4600.00),-- 2 Crème Brûlée ($9200)

-- Venta 5 (Total: 11300.00)
(5, 3, 2, 4000.00), -- 2 Tres Leches ($8000)
(5, 12, 1, 3500.00),-- 1 Panna Cotta ($3500)

-- Venta 6 (Total: 7400.00)
(6, 13, 2, 3700.00),-- 2 Tartaletas ($7400)

-- Venta 7 (Total: 11600.00)
(7, 7, 2, 5800.00), -- 2 Selva Negra ($11600)

-- Venta 8 (Total: 7000.00)
(8, 12, 2, 3500.00),-- 2 Panna Cotta ($7000)

-- Venta 9 (Total: 11400.00)
(9, 8, 2, 3900.00), -- 2 Volcanes ($7800)
(9, 14, 1, 2800.00),-- 1 Queque Marmolado ($2800)
(9, 11, 2, 1500.00),-- 2 Alfajores ($3000)

-- Venta 10 (Total: 8400.00)
(10, 9, 2, 4200.00) RETURNING *;-- 2 Crepes Suzette ($8400)