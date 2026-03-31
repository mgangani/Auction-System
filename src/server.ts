import "reflect-metadata";
import { createApp } from "./app";
import { AppDataSource } from "./config/database";
import dotenv from "dotenv";
dotenv.config();
import http from "http";
import { initSocket } from "./sockets";

const PORT = 3000;

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log("DB connected");

    const app = createApp();

    const server = http.createServer(app);
    initSocket(server);

    require("./jobs/workers");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error);
  }
}

startServer();
