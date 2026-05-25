import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        ok: false,
        message: "No token provided"
      });
    }

    // formato: Bearer TOKEN
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // guardar info del usuario en request
    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: "Token inválido"
    });
  }
};