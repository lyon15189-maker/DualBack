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

const allowedOrigins = [
  "http://localhost:3000",                  // Tu frontend local
  "https://dualfront.vercel.app", // Tu frontend en producción (Vercel)
];
const app = express();
app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como Postman o el mismo servidor)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
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