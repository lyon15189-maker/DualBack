import ReservaAsistencia from "../models/reservasAsistencia.model.js";
import Clase from "../models/clases.model.js";
import UsuarioPlan from "../models/usuariosPlanes.model.js";

const extenderVigenciaPlan = async (usuarioPlanId) => {

    const usuarioPlan =
        await UsuarioPlan.findById(usuarioPlanId);

    if (!usuarioPlan) return;

    const nuevaFecha =
        new Date(usuarioPlan.fechaVencimiento);

    nuevaFecha.setDate(
        nuevaFecha.getDate() + 30
    );

    usuarioPlan.fechaVencimiento =
        nuevaFecha;

    usuarioPlan.ultimaExtensionPorCancelacion =
        new Date();

    await usuarioPlan.save();
};

export const procesarClasesVencidas = async () => {

    try {

        console.log(
            "Procesando clases vencidas..."
        );

        const reservas =
            await ReservaAsistencia.find({
                estado: "reservado"
            });

        const ahora = new Date();

        for (const reserva of reservas) {

            const fechaClase =
                new Date(reserva.fecha);

            const [hora, minutos] =
                reserva.hora.split(":");

            fechaClase.setHours(
                Number(hora),
                Number(minutos),
                0,
                0
            );

            if (fechaClase > ahora) {
                continue;
            }

            const clase =
                await Clase.findById(
                    reserva.clase
                );

            if (!clase) {
                continue;
            }

            const totalReservados =
                await ReservaAsistencia.countDocuments({
                    clase: reserva.clase,
                    fecha: reserva.fecha,
                    hora: reserva.hora,
                    estado: "reservado"
                });

            if (
                totalReservados <
                clase.capacidadMin
            ) {

                reserva.estado =
                    "cancelado_minimo";

                await reserva.save();

                if (reserva.usuarioPlan) {

                    await extenderVigenciaPlan(
                        reserva.usuarioPlan
                    );
                }

            }

        }

    } catch (error) {

        console.error(
            "Error en cron:",
            error
        );

    }
};