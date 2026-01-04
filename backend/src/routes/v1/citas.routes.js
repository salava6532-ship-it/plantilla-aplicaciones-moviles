const express = require("express");

module.exports = (models) => {
  const router = express.Router();

  // GET /api/v1/citas
  router.get("/", async (req, res) => {
    const rows = await models.Cita.findAll({ order: [["id", "DESC"]] });
    res.json(rows);
  });

  // GET /api/v1/citas/:id
  router.get("/:id", async (req, res) => {
    const row = await models.Cita.findByPk(Number(req.params.id));
    if (!row) return res.status(404).json({ message: "Cita no encontrada" });
    res.json(row);
  });

  // POST /api/v1/citas
  router.post("/", async (req, res) => {
    const { cliente, fecha, hora, descripcion, estado } = req.body || {};

    if (!cliente || !fecha || !hora) {
      return res.status(400).json({ message: "cliente, fecha y hora son obligatorios" });
    }

    const created = await models.Cita.create({
      cliente,
      fecha,
      hora,
      descripcion: descripcion || null,
      estado: estado || "pendiente"
    });

    res.status(201).json(created);
  });

  // PUT /api/v1/citas/:id
  router.put("/:id", async (req, res) => {
    const row = await models.Cita.findByPk(Number(req.params.id));
    if (!row) return res.status(404).json({ message: "Cita no encontrada" });

    await row.update(req.body);
    res.json(row);
  });

  // DELETE /api/v1/citas/:id
  router.delete("/:id", async (req, res) => {
    const row = await models.Cita.findByPk(Number(req.params.id));
    if (!row) return res.status(404).json({ message: "Cita no encontrada" });

    await row.destroy();
    res.status(204).send();
  });

  return router;
};
