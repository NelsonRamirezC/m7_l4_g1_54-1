import express from "express";
import ventasRoutes from "./routes/ventas.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import productosRoutes from "./routes/productos.routes.js";

const app = express();

//MIDDLEWARES GLOBLALES
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//ENDPOINT
app.use("/api/ventas", ventasRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/productos", productosRoutes);

export default app;