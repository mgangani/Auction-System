import express from "express";
import cors from "cors";
import { RegisterRoutes } from "./generated/routes";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./generated/swagger.json";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // ✅ THIS IS REQUIRED
  RegisterRoutes(app);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  return app;
};
