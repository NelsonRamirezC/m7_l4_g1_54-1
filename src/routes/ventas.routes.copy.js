import express from "express";
import db from "../config/db.js";

const router = express.Router();


const validarCamposVenta = (req, res, next) => {

    if(!req.body){
        return res.status(400).json({message: "No se proporciona body."});
    }

    let {usuario_id, carrito} = req.body;

    usuario_id = Number(usuario_id);

    if(!usuario_id || !carrito || !Array.isArray(carrito) || isNaN(usuario_id) || usuario_id <= 0 ){
        return res.status(400).json({message: "No se proporcionan los campos requeridos o no cumple con el formato, revise documentación"});
    }

    next();
}

router.post("/", validarCamposVenta , async (req, res) => {
    try {

        let {usuario_id, carrito} = req.body;

        await db.query("BEGIN");

        let total = 0;
        let detalle = []
        

        //DESCONECTAR STOCK DE PRODUCTOS
        for (const item of carrito) {
            let {producto_id, cantidad, nombre } = item;

            let { rows } = await db.query("UPDATE PRODUCTOS SET stock = stock - $1 WHERE ID = $2 RETURNING precio, nombre", [cantidad, producto_id]);
            let precio = rows[0].precio;
            //OBTENEMOS EL SUBTOTAL DEL PRECIO * CANTIDAD PARA AGREGARLO AL MOMENTO DE GENERAR VENTA
            let subtotal = precio * cantidad;

            //LE AGREGAMOS AL ITEM DEL CARRITO EL PRECIO ACTUALIZADO SEGÚN DE BASE
            item.precio = precio;

            total += subtotal;

            let objetoDetalle = { producto_id, producto:nombre, cantidad, precio_unitario: precio, subtotal };

            detalle.push(objetoDetalle);

        }

        //GENERAR VENTA

        let {rows: rowsVenta} = await db.query("INSERT INTO VENTAS(USUARIO_ID, TOTAL) VALUES($1, $2) RETURNING id", [usuario_id, total]);

        let ventaId = rowsVenta[0].id;


        //GENERAR LOS DETALLES DE VENTA

        for (const item of carrito) {
            await db.query(`
                INSERT INTO DETALLE_VENTAS (VENTA_ID, PRODUCTO_ID, CANTIDAD, PRECIO_UNITARIO) 
                VALUES ($1, $2, $3, $4)`, [ventaId, item.producto_id, item.cantidad, item.precio]);
        };

        await db.query("COMMIT");

        let data = {
            venta_id: ventaId,
            usuario: usuario_id,
            total_venta: total,
            detalle
        }
        res.json({message: "Venta generada con éxito...", data});
    } catch (error) {
        console.error(error);
        await db.query("ROLLBACK");
        res.status(500).json({message: "Error interno del servidor."})
    }
});

//GET ALL VENTAS

//GET ALL VENTA POR ID CON DETALLE

export default router;
