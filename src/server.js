import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { iniciarJobs } from "./jobs/index.js";

dotenv.config();

const startServer = async () => {
  try {
    // 🔥 conectar DB
    await connectDB();
    // iniciar cron
    iniciarJobs();

    // 🔥 levantar servidor
    app.listen(process.env.PORT || 3001, () => {
      console.log("Servidor corriendo 🚀 en "+ process.env.PORT || 3001);
    });

  } catch (error) {
    console.error("Error al iniciar:", error);
    process.exit(1);
  }
};

startServer();