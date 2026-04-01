import express from "express";
import cors from "cors";
import { RegisterRoutes } from "./generated/routes";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./generated/swagger.json";
import passport from "./config/passport";
import { useGoogleStrategy } from "./middlewares/googleAuth";
import { errorHandler } from "./middlewares/errorHandler";
import { createGoogleAuthRouter } from "./modules/auth/googleAuth.routes";
import { serverAdapter as bullBoardAdapter } from "./jobs/bullBoard";

export const createApp = () => {
  useGoogleStrategy();

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use(passport.initialize());

  app.use("/api/auth", createGoogleAuthRouter());

  //setup routes
  RegisterRoutes(app);

  app.use("/api/admin/queues", bullBoardAdapter.getRouter());

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use(errorHandler);

  return app;
};
