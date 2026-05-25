import User from "../models/usuarios.model.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import Clase from "../models/clases.model.js";
import Pago from "../models/pagos.model.js";

// ======================================================
// 🔥 DASHBOARD GENERAL
// ======================================================
export const getDashboard = async (req, res) => {

  try {

    // ==========================================
    // FECHAS
    // ==========================================
    const hoy = new Date();

    const inicioDia = new Date(hoy);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(hoy);
    finDia.setHours(23, 59, 59, 999);

    // ==========================================
    // INICIO MES
    // ==========================================
    const inicioMes = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    );

    // ==========================================
    // NÚMERO ESTUDIANTES
    // ==========================================
    const numeroEstudiantes =
      await User.countDocuments({
        rol: "alumno",
        activo: true
      });

    // ==========================================
    // NÚMERO INSTRUCTORES
    // ==========================================
    const numeroInstructores =
      await User.countDocuments({
        rol: "maestro",
        activo: true
      });

    // ==========================================
    // CLASES DE HOY
    // ==========================================
    const diasSemana = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado"
    ];

    const diaHoy =
      diasSemana[hoy.getDay()];

    const clasesHoy =
      await Clase.countDocuments({
        activa: true,
        "horarios.dia": diaHoy
      });

    // ==========================================
    // INGRESOS DEL MES
    // ==========================================
    const ingresosMes = await Pago.aggregate([
      {
        $match: {
          estado: "pagado",
          fechaPago: {
            $gte: inicioMes,
            $lte: finDia
          }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$total"
          }
        }
      }
    ]);

    // ==========================================
    // RESPONSE
    // ==========================================
    res.json({
      ok: true,

      data: {

        numeroEstudiantes,

        numeroInstructores,

        clasesHoy,

        ingresosMes:
          ingresosMes[0]?.total || 0

      }

    });

  } catch (error) {

    res.status(400).json({
      ok: false,
      message: error.message
    });

  }

};

const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  const parts = url.split("/");
  const file = parts.pop();       // abc123.jpg
  const folder = parts.pop();     // usuarios

  const publicId = file.split(".")[0];

  return `${folder}/${publicId}`;
};
// 🧠 helper: parsear especialidades
const parseEspecialidades = (data) => {
  if (!data) return [];

  if (Array.isArray(data)) return data;

  if (typeof data === "string") {
    return data.split(",").map(e => e.trim());
  }

  return [];
};

// ✅ Crear usuario
export const createUser = async (req, res) => {
  try {
    let avatarUrl = "";
    let avatarPublicId = "";

    // 📸 subir imagen
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "usuarios",
      });

      avatarUrl = result.secure_url;
      avatarPublicId = result.public_id;

      fs.unlinkSync(req.file.path); // 🧹 limpiar archivo local
    }

    const user = await User.create({
      ...req.body,
      especialidades: parseEspecialidades(req.body.especialidades),
      avatar: avatarUrl,
      avatar_public_id: avatarPublicId,
    });

    res.status(201).json({
      ok: true,
      data: user,
    });

  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

// ✅ Obtener todos
export const getUsers = async (req, res) => {
  try {
    const filters = {};

    if (req.query.roles) {
      filters.rol = { $in: req.query.roles.split(",") };
    }

    if (req.query.activo !== undefined) {
      filters.activo = req.query.activo === "true";
    }

    const users = await User.find(filters)
      .sort({ createdAt: -1 });

    res.json({ ok: true, data: users });

  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

// ✅ Obtener uno
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({ ok: true, data: user });

  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
};


export const updateUser = async (req, res) => {

  try {

    const user = await User.findById(req.params.id);

    if (!user) {

      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado",
      });

    }

    // ======================================
    // DATOS
    // ======================================
    const dataToUpdate = {
      ...req.body,
      especialidades: parseEspecialidades(
        req.body.especialidades
      ),
    };

    // ======================================
    // PASSWORD
    // ======================================
    if (req.body.password) {
      user.password = req.body.password;
    }

    // ======================================
    // IMAGEN
    // ======================================
    if (req.file) {

      if (user.avatar_public_id) {

        await cloudinary.uploader.destroy(
          user.avatar_public_id
        );

      }

      const result =
        await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: "usuarios",
          }
        );

      dataToUpdate.avatar =
        result.secure_url;

      dataToUpdate.avatar_public_id =
        result.public_id;

      fs.unlinkSync(req.file.path);

    }

    // ======================================
    // ACTUALIZAR CAMPOS
    // ======================================
    Object.assign(user, dataToUpdate);

    await user.save();

    res.json({
      ok: true,
      data: user,
    });

  } catch (error) {

    res.status(400).json({
      ok: false,
      message: error.message,
    });

  }

};

// ✅ Eliminar
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado",
      });
    }

    let publicId = user.avatar_public_id;

    // 🧠 fallback si no existe
    if (!publicId && user.avatar) {
      publicId = getPublicIdFromUrl(user.avatar);
    }

    console.log("PUBLIC_ID FINAL:", publicId);

    if (publicId) {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log("DELETE CLOUDINARY:", result);
    }

    await user.deleteOne();

    res.json({
      ok: true,
      message: "Usuario eliminado correctamente",
    });

  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};