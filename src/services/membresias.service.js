// services/membresias.service.js

export const obtenerMembresiaDisponible = async (usuarioId) => {

    const hoy = new Date();

    return await Membresia.findOne({
        usuario: usuarioId,
        activa: true,
        fechaInicio: { $lte: hoy },
        fechaFin: { $gte: hoy },
        $or: [
            { clasesDisponibles: -1 },
            { clasesDisponibles: { $gt: 0 } }
        ]
    }).sort({
        fechaFin: 1,
        createdAt: 1
    });

};