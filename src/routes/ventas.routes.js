import express from "express";
import db from "../config/db.js";

const router = express.Router();


//GET ALL VENTAS
router.get("/", async (req, res) => {
    try {

        const query = {
            text: ` SELECT 
                    U.ID ID_USUARIO, CONCAT(U.NOMBRE, ' ', U.APELLIDO) NOMBRE_USUARIO, U.RUT, V.ID ID_VENTA, V.FECHA_VENTA, V.TOTAL
                    FROM USUARIOS U
                    JOIN VENTAS V
                    ON U.ID = V.USUARIO_ID;`,
            VALUES: []
        }

        let { rows:ventas } = await db.query(query);

        ventas = ventas.map(v => {
            v.url = "/api/ventas/" + v.id_venta
            return v
        })

        res.json({ ventas });
        
    } catch (error) {
        console.error("Error al procesar la venta:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }

});

//GET ALL VENTA POR ID CON DETALLE

router.get("/:id", async (req, res) => {
    try {

        let { id } = req.params;
        const query = {
            text: `SELECT 
                dv.venta_id, dv.producto_id, p.nombre producto, dv.cantidad, dv.precio_unitario, dv.subtotal 
                FROM DETALLE_VENTAS dv
                JOIN PRODUCTOS p
                on dv.producto_id = p.id
                WHERE dv.venta_id = $1`,
            values: [id]
        }

        let { rows } = await db.query(query);

        const venta = rows[0];

        res.json({ venta });
        
    } catch (error) {
        console.error("Error al procesar la venta:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});


//CREAR VENTAS
const validarCamposVenta = (req, res, next) => {
    if (!req.body) {
        return res.status(400).json({ message: "No se proporciona body." });
    }

    const { usuario_id, carrito } = req.body;
    const uid = Number(usuario_id);

    if (!uid || isNaN(uid) || uid <= 0 || !Array.isArray(carrito) || carrito.length === 0) {
        return res.status(400).json({ message: "Datos requeridos faltantes o formato inválido." });
    }

    for (const item of carrito) {
        const pId = Number(item.producto_id);
        const cant = Number(item.cantidad);
        if (!pId || !cant || isNaN(pId) || isNaN(cant) || cant <= 0) {
            return res.status(400).json({ message: "Los ítems del carrito contienen datos inválidos." });
        }
    }

    next();
};

router.post("/", validarCamposVenta, async (req, res) => {
    // 1. Obtener un cliente dedicado del pool para la transacción
    const client = await db.connect();

    try {
        const { usuario_id, carrito } = req.body;

        const { rows:rowsUsuario } = await db.query("SELECT id, nombre, apellido, rut, correo FROM Usuarios WHERE ID = $1", [usuario_id]);

        if(rowsUsuario.length == 0){
            return res.status(404).json({message: `No fue posible encontrar al usuario con id: ${usuario_id}`});
        }

        const usuario = rowsUsuario[0];

        // Normalizamos y agrupamos duplicados si viniesen en el payload
        const consolidado = carrito.reduce((acc, item) => {
            acc[item.producto_id] = (acc[item.producto_id] || 0) + Number(item.cantidad);
            return acc;
        }, {});

        const prodIds = Object.keys(consolidado).map(Number);
        const cantidades = Object.values(consolidado);

        await client.query("BEGIN");

        // 2. ACTUALIZACIÓN MASIVA DE STOCK EN UNA SOLA CONSULTA
        // Descuenta stock validando que no quede negativo (el CHECK(stock >= 0) de la BD lo respalda)
        const updateStockQuery = `
            UPDATE productos AS p
            SET stock = p.stock - v.cantidad
            FROM (
                SELECT UNNEST($1::int[]) AS id, UNNEST($2::int[]) AS cantidad
            ) AS v
            WHERE p.id = v.id AND (p.stock - v.cantidad) >= 0
            RETURNING p.id, p.nombre, p.precio, (p.precio * v.cantidad) AS subtotal, v.cantidad;
        `;

        const { rows: productosActualizados } = await client.query(updateStockQuery, [prodIds, cantidades]);

        // Si no se actualizaron todos, significa que alguno no existe o no tiene stock suficiente
        if (productosActualizados.length !== prodIds.length) {
            const actualizadosIds = new Set(productosActualizados.map(p => p.id));
            const faltantes = prodIds.filter(id => !actualizadosIds.has(id));

            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "Stock insuficiente o producto inexistente.",
                productos_afectados: faltantes
            });
        }

        // 3. Calcular total directamente de los precios reales de la BD
        const totalVenta = productosActualizados.reduce((acc, item) => acc + Number(item.subtotal), 0);

        // 4. INSERTAR CABECERA DE VENTA (1 consulta)
        const insertVentaQuery = `
            INSERT INTO ventas (usuario_id, total) 
            VALUES ($1, $2) 
            RETURNING id;
        `;
        const { rows: rowsVenta } = await client.query(insertVentaQuery, [usuario_id, totalVenta]);
        const ventaId = rowsVenta[0].id;

        // 5. INSERTAR DETALLES EN BULK (1 consulta con UNNEST)
        const detalleProdIds = productosActualizados.map(p => p.id);
        const detalleCantidades = productosActualizados.map(p => p.cantidad);
        const detallePrecios = productosActualizados.map(p => p.precio);
        const detalleVentaIds = Array(productosActualizados.length).fill(ventaId);

        const insertDetalleQuery = `
            INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario)
            SELECT * FROM UNNEST($1::int[], $2::int[], $3::int[], $4::numeric[]);
        `;
        await client.query(insertDetalleQuery, [detalleVentaIds, detalleProdIds, detalleCantidades, detallePrecios]);

        // 6. CONFIRMAR TRANSACCIÓN
        await client.query("COMMIT");

        return res.status(201).json({
            message: "Venta generada con éxito...",
            data: {
                venta_id: ventaId,
                usuario_id,
                total_venta: totalVenta,
                detalle: productosActualizados.map(p => ({
                    producto_id: p.id,
                    producto: p.nombre,
                    cantidad: p.cantidad,
                    precio_unitario: Number(p.precio),
                    subtotal: Number(p.subtotal)
                }))
            }
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error al procesar la venta:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    } finally {
        // Siempre liberar el cliente de vuelta al pool
        client.release();
    }
});


export default router;
