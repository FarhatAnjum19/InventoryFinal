const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const inventoryRoutes = require("./routes/inventory.routes");

function createApp() {
  const app = express();

  const corsOrigin = process.env.CORS_ORIGIN;
  app.use(cors(corsOrigin ? { origin: corsOrigin } : {}));
  app.use(express.json());

  app.get("/", (req, res) => {
    res.status(200).json({
      ok: true,
      message: "Inventory backend is running",
      health: "/api/health",
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, service: "inventory-backend" });
  });

  // Chrome may probe this path in dev; return 204 to avoid noisy 404 logs.
  app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
    res.status(204).end();
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/inventory", inventoryRoutes);

  return app;
}

module.exports = { createApp };
