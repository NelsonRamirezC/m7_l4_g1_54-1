-- 1. Tabla de Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    rut VARCHAR(12) UNIQUE NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 2. Tabla de Productos (Postres)
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(13, 2) NOT NULL DEFAULT 99999999999.99 CHECK(precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

-- 3. Tabla de Ventas (Encabezado de la transacción)
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(13, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_ventas_usuario 
        FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) 
        ON DELETE RESTRICT
);

-- 4. Tabla Detalle de Ventas (Líneas de productos por venta)
CREATE TABLE detalle_ventas (
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(13, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(13, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    CONSTRAINT fk_detalle_venta 
        FOREIGN KEY (venta_id) 
        REFERENCES ventas(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto 
        FOREIGN KEY (producto_id) 
        REFERENCES productos(id) 
        ON DELETE RESTRICT,
	PRIMARY KEY(venta_id, producto_id)
);