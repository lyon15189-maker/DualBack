import Producto from "../models/productos.model.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";


// ✅ Crear producto
export const createProducto = async (req, res) => {
    try {

        const {
            nombre,
            descripcion,
            categoria,
            cantidad,
            precio,
            precioCompra,
            talla,
            color,
            fechaCompra,
            estado
        } = req.body;

        // ✅ Validaciones
        if (
            !nombre ||
            !descripcion ||
            !categoria ||
            cantidad === undefined ||
            precio === undefined ||
            precioCompra === undefined ||
            !fechaCompra
        ) {
            return res.status(400).json({
                ok: false,
                message: "Faltan campos obligatorios"
            });
        }

        // ✅ Subir imágenes
        let imagenes = [];

        if (req.files && req.files.length > 0) {

            for (const file of req.files) {

                const result = await cloudinary.uploader.upload(
                    file.path,
                    {
                        folder: "productos"
                    }
                );

                imagenes.push(result.secure_url);

                // limpiar archivos temporales
                fs.unlinkSync(file.path);
            }
        }

        if (imagenes.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "Debe subir al menos una imagen"
            });
        }

        // ✅ Estado automático
        let estadoFinal = estado || "disponible";

        if (estadoFinal !== "pausado") {

            if (Number(cantidad) <= 0) {
                estadoFinal = "agotado";
            } else {
                estadoFinal = "disponible";
            }

        }

        // ✅ Crear producto
        const producto = await Producto.create({

            nombre,

            descripcion,

            categoria: Array.isArray(categoria)
                ? categoria
                : categoria.split(","),

            // historial
            cantidadInicial: Number(cantidad),

            // stock actual
            cantidad: Number(cantidad),

            vendidos: 0,

            estado: estadoFinal,

            precio: Number(precio),

            precioCompra: Number(precioCompra),

            imagen: imagenes,

            talla: talla
                ? (
                    Array.isArray(talla)
                        ? talla
                        : talla.split(",")
                )
                : [],

            color: color
                ? (
                    Array.isArray(color)
                        ? color
                        : color.split(",")
                )
                : [],

            fechaCompra
        });

        res.status(201).json({
            ok: true,
            data: producto
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }
};


// ✅ Obtener productos
export const getProductos = async (req, res) => {

    try {

        const filters = {};

        // filtro por categoría
        if (req.query.categoria) {

            filters.categoria = {
                $in: req.query.categoria.split(",")
            };

        }

        // filtro por estado
        if (req.query.estado) {

            filters.estado = req.query.estado;

        }

        const productos = await Producto.find(filters);

        res.json({
            ok: true,
            data: productos
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }
};


// ✅ Obtener producto por ID
export const getProductoById = async (req, res) => {

    try {

        const producto = await Producto.findById(req.params.id);

        if (!producto) {

            return res.status(404).json({
                ok: false,
                message: "Producto no encontrado"
            });

        }

        res.json({
            ok: true,
            data: producto
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }
};


// ✅ Actualizar producto
// ✅ Actualizar producto
export const updateProducto = async (req, res) => {

    try {

        const producto = await Producto.findById(req.params.id);

        if (!producto) {

            return res.status(404).json({
                ok: false,
                message: "Producto no encontrado"
            });

        }

        let nuevasImagenes = producto.imagen;

        // ✅ Si llegan nuevas imágenes
        if (req.files && req.files.length > 0) {

            // ==============================
            // ELIMINAR IMÁGENES ANTERIORES
            // ==============================
            for (const imgUrl of producto.imagen) {

                // obtener public_id desde la URL
                const partes = imgUrl.split("/");

                const nombreArchivo = partes[partes.length - 1];

                const publicId =
                    "productos/" +
                    nombreArchivo.split(".")[0];

                await cloudinary.uploader.destroy(publicId);

            }

            // ==============================
            // SUBIR NUEVAS IMÁGENES
            // ==============================
            nuevasImagenes = [];

            for (const file of req.files) {

                const result = await cloudinary.uploader.upload(
                    file.path,
                    {
                        folder: "productos"
                    }
                );

                nuevasImagenes.push(result.secure_url);

                // eliminar temporal
                fs.unlinkSync(file.path);
            }
        }

        // ✅ data a actualizar
        const data = {
            ...req.body,
            imagen: nuevasImagenes
        };

        // convertir número
        if (data.cantidad !== undefined) {
            data.cantidad = Number(data.cantidad);
        }

        // ✅ estado automático
        if (data.estado !== "pausado") {

            if (Number(data.cantidad) <= 0) {
                data.estado = "agotado";
            } else {
                data.estado = "disponible";
            }

        }

        const updated = await Producto.findByIdAndUpdate(
            req.params.id,
            data,
            {
                new: true
            }
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


// ✅ Eliminar producto
export const deleteProducto = async (req, res) => {

    try {

        const producto = await Producto.findById(req.params.id);

        if (!producto) {

            return res.status(404).json({
                ok: false,
                message: "Producto no encontrado"
            });

        }

        // ==============================
        // ELIMINAR IMÁGENES CLOUDINARY
        // ==============================
        for (const imgUrl of producto.imagen) {

            try {

                const partes = imgUrl.split("/");

                const nombreArchivo =
                    partes[partes.length - 1];

                const publicId =
                    "productos/" +
                    nombreArchivo.split(".")[0];

                await cloudinary.uploader.destroy(publicId);

            } catch (error) {

                console.log(
                    "Error eliminando imagen:",
                    error.message
                );

            }

        }

        // ==============================
        // ELIMINAR PRODUCTO
        // ==============================
        await producto.deleteOne();

        res.json({
            ok: true,
            message: "Producto eliminado correctamente"
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }
};



// ✅ Simular venta / descontar stock
export const venderProducto = async (req, res) => {

    try {

        const { cantidadVendida } = req.body;

        const producto = await Producto.findById(req.params.id);

        if (!producto) {

            return res.status(404).json({
                ok: false,
                message: "Producto no encontrado"
            });

        }

        // validar stock
        if (producto.cantidad < cantidadVendida) {

            return res.status(400).json({
                ok: false,
                message: "Stock insuficiente"
            });

        }

        // descontar stock
        producto.cantidad -= Number(cantidadVendida);

        // aumentar vendidos
        producto.vendidos += Number(cantidadVendida);

        // actualizar estado
        if (producto.cantidad <= 0) {
            producto.estado = "agotado";
        } else {
            producto.estado = "disponible";
        }

        await producto.save();

        res.json({
            ok: true,
            message: "Venta realizada",
            data: producto
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }
};