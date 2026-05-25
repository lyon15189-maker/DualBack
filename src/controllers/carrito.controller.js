import Carrito from "../models/carrito.model.js";
import Producto from "../models/productos.model.js";

// ======================================================
// AGREGAR PRODUCTO AL CARRITO
// ======================================================
export const agregarProductoCarrito = async (req, res) => {

    try {

        const usuario = req.user.id;

        const {
            productoId,
            cantidad = 1,
            talla = null,
            color = null
        } = req.body;

        const producto = await Producto.findById(
            productoId
        );

        if (!producto) {

            return res.status(404).json({
                ok: false,
                message: "Producto no encontrado"
            });

        }

        let carrito = await Carrito.findOne({
            usuario
        });

        if (!carrito) {

            carrito = await Carrito.create({
                usuario,
                items: []
            });

        }

        const itemExistente =
            carrito.items.find(
                (item) =>
                    item.producto.toString() === productoId &&
                    item.talla === talla &&
                    item.color === color
            );

        if (itemExistente) {

            itemExistente.cantidad += Number(
                cantidad
            );

        } else {

            carrito.items.push({
                producto: producto._id,
                nombre: producto.nombre,
                imagen:
                    producto.imagen?.[0] || "",
                precio: producto.precio,
                cantidad: Number(cantidad),
                talla,
                color
            });

        }

        await carrito.save();

        res.json({
            ok: true,
            data: carrito
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// OBTENER MI CARRITO
// ======================================================
export const getMiCarrito = async (req, res) => {

    try {

        const usuario = req.user.id;

        let carrito = await Carrito.findOne({
            usuario
        }).populate(
            "items.producto"
        );

        if (!carrito) {

            carrito = await Carrito.create({
                usuario,
                items: []
            });

        }

        res.json({
            ok: true,
            data: carrito
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// ACTUALIZAR CANTIDAD
// ======================================================
export const actualizarCantidadCarrito =
    async (req, res) => {

        try {

            const usuario = req.user.id;

            const {
                productoId,
                cantidad
            } = req.body;

            const carrito =
                await Carrito.findOne({
                    usuario
                });

            if (!carrito) {

                return res.status(404).json({
                    ok: false,
                    message:
                        "Carrito no encontrado"
                });

            }

            const item =
                carrito.items.find(
                    (item) =>
                        item.producto.toString() ===
                        productoId
                );

            if (!item) {

                return res.status(404).json({
                    ok: false,
                    message:
                        "Producto no encontrado en el carrito"
                });

            }

            item.cantidad =
                Number(cantidad);

            await carrito.save();

            res.json({
                ok: true,
                data: carrito
            });

        } catch (error) {

            res.status(400).json({
                ok: false,
                message: error.message
            });

        }

    };

// ======================================================
// ELIMINAR PRODUCTO DEL CARRITO
// ======================================================
export const eliminarProductoCarrito = async (req, res) => {

    try {
        // console.log("PARAMS:", req.params);
        const usuario = req.user.id;
        const { id } = req.params;

        const carrito = await Carrito.findOne({
            usuario
        });

        if (!carrito) {
            return res.status(404).json({
                ok: false,
                message: "Carrito no encontrado"
            });
        }

        carrito.items = carrito.items.filter(
            item =>
                item._id.toString() !== id
        );

        await carrito.save();

        res.json({
            ok: true,
            message: "Producto eliminado",
            data: carrito
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};
// ======================================================
// VACIAR CARRITO
// ======================================================
export const vaciarCarrito = async (
    req,
    res
) => {

    try {

        const usuario = req.user.id;

        const carrito =
            await Carrito.findOne({
                usuario
            });

        if (!carrito) {

            return res.status(404).json({
                ok: false,
                message:
                    "Carrito no encontrado"
            });

        }

        carrito.items = [];

        await carrito.save();

        res.json({
            ok: true,
            message:
                "Carrito vaciado correctamente"
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// OBTENER TODOS LOS CARRITOS
// ADMIN
// ======================================================
export const getCarritos = async (
    req,
    res
) => {

    try {

        const carritos =
            await Carrito.find()
                .populate(
                    "usuario",
                    "nombre apellidos email"
                )
                .populate(
                    "items.producto"
                )
                .sort({
                    updatedAt: -1
                });

        res.json({
            ok: true,
            data: carritos
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};