SELECT * FROM USUARIOS;

SELECT * FROM PRODUCTOS;

SELECT * FROM VENTAS;

SELECT * FROM DETALLE_VENTAS;


-- DETALLE REGISTRO DE VENTAS
SELECT 
u.id usuario_id, u.nombre, u.apellido, u.rut, v.id venta_id, v.fecha_venta, 
v.total, dv.producto_id, p.nombre produdcto, dv.cantidad, dv.precio_unitario, dv.subtotal
FROM USUARIOS u
JOIN VENTAS v
ON u.id = v.usuario_id
JOIN DETALLE_VENTAS dv
ON v.id = dv.venta_id
JOIN PRODUCTOS p
ON dv.producto_id = p.id;

--SÓLO DETALLE DE LA VENTA
SELECT dv.venta_id, dv.producto_id, p.nombre producto, dv.cantidad, dv.precio_unitario, dv.subtotal 
FROM DETALLE_VENTAS dv
JOIN PRODUCTOS p
on dv.producto_id = p.id
WHERE dv.venta_id = 1;
