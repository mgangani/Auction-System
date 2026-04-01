import { Router, type Request, type Response, type NextFunction } from "express";
import {
  googleOAuthCallback,
  googleOAuthInitiate,
} from "../../middlewares/googleAuth";
import { AuthService } from "./auth.service";

export function createGoogleAuthRouter(): Router {
  const router = Router();
  const authService = new AuthService();

  router.get("/google", googleOAuthInitiate);

  router.get(
    "/google/callback",
    googleOAuthCallback,
    async (req: Request, res: Response) => {
      const tokens = await authService.googleLogin(
        req.user as {
          email: string;
          name: string;
          googleId: string;
        },
      );

      res.redirect(
        `${process.env.GOOGLE_SUCCESS_URL}?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
      );
    },
  );

  return router;
}
