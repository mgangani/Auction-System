import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { ServerToClientEvents, ClientToServerEvents } from "./socket.types";

let io: Server<ClientToServerEvents, ServerToClientEvents>;

export const initSocket = (httpServer: any) => {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: "*",
    },
  });

  // 🔐 Auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.query?.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded: any = jwt.verify(token as string, process.env.JWT_SECRET!);

      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.user.sub;

    console.log("Socket connected:", userId);

    // 👤 Join personal room
    socket.join(`user:${userId}`);

    // 🏷 Join auction room
    socket.on("join_auction", (productId) => {
      socket.join(`auction:${productId}`);
      console.log(`User ${userId} joined auction: ${productId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
