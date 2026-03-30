import "reflect-metadata";
import { createApp } from "./app";
import { AppDataSource } from "./config/database";
import dotenv from "dotenv";
dotenv.config();

const PORT = 3000;

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log("DB connected");

    require("./jobs/workers");
    const app = createApp();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error);
  }
}

startServer();
