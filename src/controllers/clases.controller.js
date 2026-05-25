import Clase from "../models/clases.model.js";


// 🧠 validar formato HH:mm
const isValidHour = (hora) =>
  /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);


// 🧠 validar estructura de horarios
const validateHorarios = (horarios) => {
  if (!Array.isArray(horarios) || horarios.length === 0) return false;

  for (const h of horarios) {
    if (!h.dia || !Array.isArray(h.horas) || h.horas.length === 0) {
      return false;
    }

    for (const hora of h.horas) {
      if (!isValidHour(hora)) return false;
    }
  }

  return true;
};


// 🧠 detectar conflictos (mismo instructor, mismo día y misma hora)
const existsConflict = async ({ instructor, horarios, excludeId = null }) => {
  const clases = await Clase.find({
    instructor,
    activa: true,
    ...(excludeId && { _id: { $ne: excludeId } })
  });

  for (const clase of clases) {
    for (const h1 of clase.horarios) {
      for (const h2 of horarios) {
        if (h1.dia === h2.dia) {
          const choque = h1.horas.some(hora => h2.horas.includes(hora));
          if (choque) return true;
        }
      }
    }
  }

  return false;
};


// ✅ Crear clase
export const createClass = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      color,
      horarios,
      duracion,
      capacidad,
      capacidadMin,
      instructor
    } = req.body;

    if (!nombre || !horarios || !duracion || !capacidad || !capacidadMin || !instructor) {
      return res.status(400).json({
        ok: false,
        message: "Faltan campos obligatorios"
      });
    }

    if (!validateHorarios(horarios)) {
      return res.status(400).json({
        ok: false,
        message: "Formato de horarios inválido"
      });
    }

    const conflict = await existsConflict({ instructor, horarios });

    if (conflict) {
      return res.status(400).json({
        ok: false,
        message: "El instructor ya tiene una clase en ese horario"
      });
    }

    const newClass = await Clase.create({
      nombre,
      descripcion,
      color,
      horarios,
      duracion,
      capacidad,
      capacidadMin,
      instructor
    });

    res.status(201).json({
      ok: true,
      data: newClass
    });

  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};


// ✅ Obtener todas
export const getClasses = async (req, res) => {
  try {
    const filters = {};

    if (req.query.instructor) {
      filters.instructor = req.query.instructor;
    }

    if (req.query.activa !== undefined) {
      filters.activa = req.query.activa === "true";
    }

    const classes = await Clase.find(filters)
      .populate("instructor", "nombre apellidos email");

    res.json({
      ok: true,
      data: classes
    });

  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};


// ✅ Obtener una
export const getClassById = async (req, res) => {
  try {
    const clase = await Clase.findById(req.params.id)
      .populate("instructor", "nombre apellidos email");

    if (!clase) {
      return res.status(404).json({
        ok: false,
        message: "Clase no encontrada"
      });
    }

    res.json({
      ok: true,
      data: clase
    });

  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};


// ✅ Actualizar
export const updateClass = async (req, res) => {
  try {
    const clase = await Clase.findById(req.params.id);

    if (!clase) {
      return res.status(404).json({
        ok: false,
        message: "Clase no encontrada"
      });
    }

    const newData = {
      nombre: req.body.nombre ?? clase.nombre,
      descripcion: req.body.descripcion ?? clase.descripcion,
      horarios: req.body.horarios ?? clase.horarios,
      duracion: req.body.duracion ?? clase.duracion,
      capacidad: req.body.capacidad ?? clase.capacidad,
      capacidadMin: req.body.capacidadMin ?? clase.capacidadMin,
      instructor: req.body.instructor ?? clase.instructor,
      color: req.body.color ?? clase.color
    };

    if (!validateHorarios(newData.horarios)) {
      return res.status(400).json({
        ok: false,
        message: "Formato de horarios inválido"
      });
    }

    const conflict = await existsConflict({
      instructor: newData.instructor,
      horarios: newData.horarios,
      excludeId: clase._id
    });

    if (conflict) {
      return res.status(400).json({
        ok: false,
        message: "Conflicto de horario para el instructor"
      });
    }

    const updated = await Clase.findByIdAndUpdate(
      req.params.id,
      newData,
      { new: true }
    );

    res.json({
      ok: true,
      data: updated
    });

  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};


// ✅ Eliminar
export const deleteClass = async (req, res) => {
  try {
    const clase = await Clase.findById(req.params.id);

    if (!clase) {
      return res.status(404).json({
        ok: false,
        message: "Clase no encontrada"
      });
    }

    await clase.deleteOne();

    res.json({
      ok: true,
      message: "Clase eliminada correctamente"
    });

  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};