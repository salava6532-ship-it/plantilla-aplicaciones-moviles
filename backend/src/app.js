const express = require("express");
const cors = require("cors");
require("dotenv").config();

module.exports = (models) => {
  const app = express();

  // ✅ CORS compatible con Cordova y navegadores
  const corsOptions = {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
    credentials: false
  };

  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));
  app.use(express.json());

  // Health check
  app.get("/api/v1/health", (req, res) => {
    res.json({
      ok: true,
      api: "v1",
      proto: req.protocol,
      forwardedProto: req.get("x-forwarded-proto") || null
    });
  });

  // API v1
  const v1 = express.Router();

  // ✅ Rutas Agenda de Citas
  v1.use("/citas", require("./routes/v1/citas.routes")(models));

  app.use("/api/v1", v1);

  // 404
  app.use((req, res) => res.status(404).json({ message: "Not found" }));

  return app;
};
