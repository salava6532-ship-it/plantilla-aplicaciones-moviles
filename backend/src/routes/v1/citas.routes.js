const express = require("express");

module.exports = (models) => {
  const router = express.Router();

  const estadosValidos = ["pendiente", "confirmada", "cancelada"];

  // GET /api/v1/citas?usuarioId=1
  router.get("/", async (req, res) => {
    const { usuarioId } = req.query;

    if (!usuarioId) {
      return res.status(400).json({
        message: "usuarioId es obligatorio"
      });
    }

    const rows = await models.Cita.findAll({
      where: { usuarioId },
      order: [["id", "DESC"]]
    });

    res.json(rows);
  });

  // GET /api/v1/citas/:id
  router.get("/:id", async (req, res) => {
    const row = await models.Cita.findByPk(Number(req.params.id));
    if (!row) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }
    res.json(row);
  });

  // POST /api/v1/citas
  router.post("/", async (req, res) => {
    const { cliente, fecha, hora, descripcion, estado, usuarioId } = req.body || {};

    // 1. Campos obligatorios
    if (!cliente || !fecha || !hora || !usuarioId) {
      return res.status(400).json({
        message: "cliente, fecha, hora y usuarioId son obligatorios"
      });
    }

    // 2. Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({
        message: "Formato de fecha inválido (YYYY-MM-DD)"
      });
    }

    // 3. Evitar fechas pasadas
    const hoy = new Date().toISOString().split("T")[0];
    if (fecha < hoy) {
      return res.status(400).json({
        message: "No se permiten citas en fechas pasadas"
      });
    }

    // 4. Validar formato de hora
    if (!/^\d{2}:\d{2}$/.test(hora)) {
      return res.status(400).json({
        message: "Formato de hora inválido (HH:MM)"
      });
    }

    // 5. Validar estado
    const estadoFinal = estado || "pendiente";
    if (!estadosValidos.includes(estadoFinal)) {
      return res.status(400).json({
        message: "Estado no válido. Use: pendiente, confirmada o cancelada"
      });
    }

    const created = await models.Cita.create({
      cliente,
      fecha,
      hora,
      descripcion: descripcion || null,
      estado: estadoFinal,
      usuarioId
    });

    res.status(201).json(created);
  });

  // PUT /api/v1/citas/:id
  router.put("/:id", async (req, res) => {
    const row = await models.Cita.findByPk(Number(req.params.id));
    if (!row) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    const { estado, fecha } = req.body;

    // Validar estado
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({
        message: "Estado no válido. Use: pendiente, confirmada o cancelada"
      });
    }

    // Validar fecha
    if (fecha) {
      const hoy = new Date().toISOString().split("T")[0];
      if (fecha < hoy) {
        return res.status(400).json({
          message: "No se permiten fechas pasadas"
        });
      }
    }

    await row.update(req.body);
    res.json(row);
  });

  // DELETE /api/v1/citas/:id
  router.delete("/:id", async (req, res) => {
    const row = await models.Cita.findByPk(Number(req.params.id));
    if (!row) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    await row.destroy();
    res.status(204).send();
  });

  return router;
};
