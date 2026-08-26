import nodemailer from "nodemailer";
import User from "../models/usuarios.model.js";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ======================================
// ENVIAR CORREO
// ======================================
export const enviarCorreo = async (
    destino,
    asunto,
    html
) => {
    try {

        if (!destino) {
            return;
        }

        await transporter.sendMail({
            from: `"Pole Project" <${process.env.EMAIL_USER}>`,
            to: destino,
            subject: asunto,
            html
        });

    } catch (error) {

        console.error(
            "Error enviando correo:",
            error.message
        );

    }
};

// ======================================
// NOTIFICAR ADMINS
// ======================================
export const notificarAdministradores = async (
    asunto,
    html
) => {

    try {

        const administradores =
            await User.find({
                rol: "admin",
                activo: true
            });

        await Promise.allSettled(
            administradores.map(admin => {

                if (!admin.email) {
                    return Promise.resolve();
                }

                return enviarCorreo(
                    admin.email,
                    asunto,
                    html
                );

            })
        );

    } catch (error) {

        console.error(
            "Error notificando administradores:",
            error.message
        );

    }

};