require("dotenv").config();

const connectDB = require("./config/db");
const { createApp } = require("./app");

function requireEnv(name) {
  if (!process.env[name] || !String(process.env[name]).trim()) {
    throw new Error(`${name} is required`);
  }
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    requireEnv("MONGODB_URI");
    requireEnv("JWT_SECRET");
    requireEnv("LOGIN_ONLY_USER");
    requireEnv("LOGIN_ONLY_PASSWORD");

    await connectDB();
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
