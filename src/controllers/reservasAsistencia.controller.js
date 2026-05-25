import ReservaAsistencia from "../models/reservasAsistencia.model.js";
import Clase from "../models/clases.model.js";

/**
 * ✅ Crear reserva
 */
export const createReserva = async (req, res, next) => {
  try {
    const { clase, fecha, hora } = req.body;
    const alumno = req.user.id; // 🔥 desde el token

    if (!clase || !fecha || !hora) {
      return res.status(400).json({
        ok: false,
        message: "Faltan campos obligatorios"
      });
    }

    const claseData = await Clase.findById(clase);

    if (!claseData) {
      return res.status(404).json({
        ok: false,
        message: "Clase no encontrada"
      });
    }

    // evitar duplicados
    const existeReserva = await ReservaAsistencia.findOne({
      alumno,
      clase,
      fecha,
      hora
    });

    if (existeReserva) {
      return res.status(400).json({
        ok: false,
        message: "Ya tienes una reserva"
      });
    }

    const totalReservas = await ReservaAsistencia.countDocuments({
      clase,
      fecha,
      hora,
      estado: { $in: ["reservado", "asistio"] }
    });

    if (totalReservas >= claseData.capacidad) {
      return res.status(400).json({
        ok: false,
        message: "La clase ya está llena"
      });
    }

    const reserva = await ReservaAsistencia.create({
      alumno,
      clase,
      instructor: claseData.instructor,
      fecha,
      hora
    });

    res.status(201).json({
      ok: true,
      data: reserva
    });

  } catch (error) {
    next(error);
  }
};

/**
 * ✅ Obtener reservas (filtros opcionales)
 */
export const getReservas = async (req, res) => {
  try {
    const filters = {};

    if (req.query.clase) {
      filters.clase = req.query.clase;
    }

    if (req.query.alumno) {
      filters.alumno = req.query.alumno;
    }

    if (req.query.fecha) {
      filters.fecha = new Date(req.query.fecha);
    }

    const reservas = await ReservaAsistencia.find(filters)
      .populate("alumno", "nombre apellidos email")
      .populate("instructor", "nombre apellidos")
      .populate("clase", "nombre capacidad capacidadMin");

    res.json({
      ok: true,
      data: reservas
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};

/**
 * ✅ Obtener una reserva
 */
export const getReservaById = async (req, res) => {
  try {
    const reserva = await ReservaAsistencia.findById(req.params.id)
      .populate("alumno", "nombre apellidos email")
      .populate("instructor", "nombre apellidos")
      .populate("clase", "nombre");

    if (!reserva) {
      return res.status(404).json({
        ok: false,
        message: "Reserva no encontrada"
      });
    }

    res.json({
      ok: true,
      data: reserva
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};

export const reactivarReserva = async (req, res) => {
  try {
    const reserva = await ReservaAsistencia.findById(req.params.id);

    if (!reserva) {
      return res.status(404).json({
        ok: false,
        message: "Reserva no encontrada"
      });
    }

    if (reserva.estado !== "cancelado") {
      return res.status(400).json({
        ok: false,
        message: "Solo puedes reactivar reservas canceladas"
      });
    }

    // 🔥 validar que aún haya espacio
    const totalReservas = await ReservaAsistencia.countDocuments({
      clase: reserva.clase,
      fecha: reserva.fecha,
      hora: reserva.hora,
      estado: { $in: ["reservado", "asistio"] }
    });

    const clase = await Clase.findById(reserva.clase);

    if (totalReservas >= clase.capacidad) {
      return res.status(400).json({
        ok: false,
        message: "La clase ya está llena"
      });
    }

    reserva.estado = "reservado";
    await reserva.save();

    res.json({
      ok: true,
      message: "Reserva reactivada correctamente"
    });

  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};

/**
 * ✅ Cancelar reserva
 */
export const cancelarReserva = async (req, res) => {
  try {
    const reserva = await ReservaAsistencia.findById(req.params.id);

    if (!reserva) {
      return res.status(404).json({
        ok: false,
        message: "Reserva no encontrada"
      });
    }

    reserva.estado = "cancelado";
    await reserva.save();

    res.json({
      ok: true,
      message: "Reserva cancelada correctamente"
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};

/**
 * ✅ Lista de asistencia
 */
export const getListaAsistencia = async (req, res) => {
  try {
    const { claseId, fecha, hora } = req.query;

    if (!claseId || !fecha || !hora) {
      return res.status(400).json({
        ok: false,
        message: "Faltan parámetros"
      });
    }

    const lista = await ReservaAsistencia.find({
      clase: claseId,
      fecha: new Date(fecha),
      hora
    })
      .populate("alumno", "nombre apellidos email telefono")
      .populate("instructor", "nombre apellidos")
      .sort({ createdAt: 1 });

    res.json({
      ok: true,
      data: lista
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};

/**
 * ✅ Marcar asistencia
 */
export const marcarAsistencia = async (req, res) => {
  try {
    const reserva = await ReservaAsistencia.findById(req.params.id);

    if (!reserva) {
      return res.status(404).json({
        ok: false,
        message: "Reserva no encontrada"
      });
    }

    reserva.estado = "asistio";
    reserva.checkIn = new Date();

    await reserva.save();

    res.json({
      ok: true,
      message: "Asistencia registrada"
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};

/**
 * ✅ Marcar falta
 */
export const marcarFalta = async (req, res) => {
  try {
    const reserva = await ReservaAsistencia.findById(req.params.id);

    if (!reserva) {
      return res.status(404).json({
        ok: false,
        message: "Reserva no encontrada"
      });
    }

    reserva.estado = "no_asistio";

    await reserva.save();

    res.json({
      ok: true,
      message: "Falta registrada"
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};
export const marcarAsistenciaMasiva = async (req, res) => {
  try {
    const { claseId, fecha, hora, asistieron } = req.body;

    if (!claseId || !fecha || !hora || !Array.isArray(asistieron)) {
      return res.status(400).json({
        ok: false,
        message: "Datos incompletos"
      });
    }

    // Obtener todas las reservas de esa clase/día/hora
    const reservas = await ReservaAsistencia.find({
      clase: claseId,
      fecha: new Date(fecha),
      hora
    });

    const operaciones = reservas.map(reserva => {
      if (asistieron.includes(reserva._id.toString())) {
        return {
          updateOne: {
            filter: { _id: reserva._id },
            update: {
              estado: "asistio",
              checkIn: new Date()
            }
          }
        };
      } else {
        return {
          updateOne: {
            filter: { _id: reserva._id },
            update: {
              estado: "no_asistio"
            }
          }
        };
      }
    });

    await ReservaAsistencia.bulkWrite(operaciones);

    res.json({
      ok: true,
      message: "Asistencia actualizada correctamente"
    });

  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};

/**
 * ✅ Eliminar reserva (opcional)
 */
export const deleteReserva = async (req, res) => {
  try {
    const reserva = await ReservaAsistencia.findById(req.params.id);

    if (!reserva) {
      return res.status(404).json({
        ok: false,
        message: "Reserva no encontrada"
      });
    }

    await reserva.deleteOne();

    res.json({
      ok: true,
      message: "Reserva eliminada correctamente"
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
};