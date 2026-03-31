import express from "express";
import cors from "cors";
import { RegisterRoutes } from "./generated/routes";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./generated/swagger.json";
import passport from "./config/passport";
import { errorHandler } from "./middlewares/errorHandler";
import { AuthService } from "./modules/auth/auth.service";
import { serverAdapter as bullBoardAdapter } from "./jobs/bullBoard";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use(passport.initialize());

   // Google OAuth routes (kept outside TSOA to avoid decorator constraints)
   const authService = new AuthService();

   app.get(
     "/api/auth/google",
     (req, res, next) => {
       console.log("Triggering Google OAuth");
       next();
     },
     passport.authenticate("google", {
       scope: ["profile", "email"],
     }),
   );

   app.get(
     "/api/auth/google/callback",
     (req, res, next) => {
       console.log("Callback triggered");
       next();
     },
     passport.authenticate("google", { session: false }),
     async (req: any, res) => {
       const tokens = await authService.googleLogin(req.user);

       res.redirect(
         `http://localhost:3000/api/auth/success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
       );
     },
   );

//setup routes
   RegisterRoutes(app);

  app.use("/api/admin/queues", bullBoardAdapter.getRouter());

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use(errorHandler);

  return app;
};
