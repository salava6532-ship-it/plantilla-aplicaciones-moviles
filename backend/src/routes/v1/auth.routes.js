const express = require("express");

module.exports = (models) => {
  const router = express.Router();

  // REGISTRO
  router.post("/register", async (req, res) => {
    const { nombre, email, password } = req.body;

    // Validaciones
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Correo electrónico no válido" });
    }

    if (password.length < 5) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 5 caracteres" });
    }

    const existe = await models.Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const usuario = await models.Usuario.create({
      nombre,
      email,
      password
    });

    res.status(201).json({
      message: "Usuario registrado correctamente",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
  });

  // LOGIN
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Correo y contraseña son obligatorios" });
    }

    const usuario = await models.Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (usuario.password !== password) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    res.json({
      message: "Inicio de sesión exitoso",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
  });

  return router;
};
