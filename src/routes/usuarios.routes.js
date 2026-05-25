import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboard
} from "../controllers/usuarios.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/roles.middleware.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, roleMiddleware("admin"), getDashboard);
router.post("/", upload.single("avatar"), createUser);
router.get("/", authMiddleware, getUsers);
router.get("/:id", authMiddleware, getUserById);
router.put("/:id", authMiddleware, upload.single("avatar"), updateUser);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteUser);

export default router;