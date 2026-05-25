import { loginUser } from "../services/auth.service.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log("4",email, password);
    const result = await loginUser({ email, password });

    res.json({
      ok: true,
      data: result
    });

  } catch (error) {
    res.status(401).json({
      ok: false,
      message: error.message
    });
  }
};