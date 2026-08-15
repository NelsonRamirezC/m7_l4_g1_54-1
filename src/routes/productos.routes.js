import express from "express";
import db from "../config/db.js";

const router = express.Router();

//GET ALL PRODUCTOS
router.get("/", async (req, res) => {
    try {

        let { rows } = await db.query("SELECT id, nombre, precio, descripcion, stock FROM Productos");

        res.json({productos: rows});

    } catch (error) {
        console.error("Error al procesar la venta:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }

});


//GET ALL PRODUCTOS BY ID
router.get("/:id", async (req, res) => {
    try {

        let { id } = req.params;

        let { rowCount, rows } = await 
        db.query("SELECT id, nombre, precio, descripcion, stock FROM Productos WHERE id = $1", [id]);

        if(rowCount == 0){
            return res.status(404).json({message: "No existe un producto con el ID: "+id});
        }

        const producto = rows[0];

        res.json({ producto });
        
    } catch (error) {
        console.error("Error al procesar la venta:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }

});

export default router;