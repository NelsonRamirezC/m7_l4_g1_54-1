import express from "express";
import db from "../config/db.js";

const router = express.Router();

//GET ALL USUARIOS
router.get("/", async (req, res) => {
    try {

        let { rows } = await db.query("SELECT id, nombre, apellido, rut, correo FROM USUARIOS");

        res.json({usuarios: rows});
    } catch (error) {
        console.error("Error al procesar la venta:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }

});


//GET ALL USUARIO BY ID
router.get("/:id", async (req, res) => {
    try {

        let { id } = req.params;

        let { rowCount, rows } = await 
        db.query("SELECT id, nombre, apellido, rut, correo FROM USUARIOS WHERE id = $1", [id]);

        if(rowCount == 0){
            return res.status(404).json({message: "No existe un usuario con el ID: "+id});
        }

        const usuario = rows[0];

        res.json({ usuario });
        
    } catch (error) {
        console.error("Error al procesar la venta:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

export default router;