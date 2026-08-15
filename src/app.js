import express from "express";
import path from "node:path";
import ventasRoutes from "./routes/ventas.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import productosRoutes from "./routes/productos.routes.js";

const app = express();
const publicPath = path.join(process.cwd(), "public");

//MIDDLEWARES GLOBLALES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

app.get("/productos", (req, res) => {
    res.sendFile(path.join(publicPath, "productos.html"));
});

app.get("/usuarios", (req, res) => {
    res.sendFile(path.join(publicPath, "usuarios.html"));
});

app.get("/historial", (req, res) => {
    res.sendFile(path.join(publicPath, "historial.html"));
});

app.get("/ventas", (req, res) => {
    res.sendFile(path.join(publicPath, "ventas.html"));
});

app.get("/ventas-detalle", (req, res) => {
    res.sendFile(path.join(publicPath, "ventas-detalle.html"));
});

app.get("/carrito", (req, res) => {
    res.sendFile(path.join(publicPath, "carrito.html"));
});

//ENDPOINT
app.use("/api/ventas", ventasRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/productos", productosRoutes);

export default app;
