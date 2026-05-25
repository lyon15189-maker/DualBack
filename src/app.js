import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/usuarios.routes.js";
import clasesRoutes from "./routes/clases.routes.js";
import reservasRoutes from "./routes/reservasAsistencia.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import planesRoutes from "./routes/planes.routes.js";
import cuponesRoutes from "./routes/cupones.routes.js";
import pagosRoutes from "./routes/pagos.routes.js";
import carritoRoutes from "./routes/carrito.routes.js";


const app = express();
app.use(cors({
  origin: "http://localhost:3000", // frontend
  credentials: true
}));
app.use(express.json());

// ruta test
app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});
app.use("/api/carrito", carritoRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/planes", planesRoutes);
app.use("/api/cupones", cuponesRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/clases", clasesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

export default app;