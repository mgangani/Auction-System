import dotenv from "dotenv";
dotenv.config();

import passport from "passport";

export type GoogleOAuthStrategyConfig = {
  clientID: string;
  clientSecret: string;
  callbackURL: string | undefined;
};

export function getGoogleOAuthEnv(): GoogleOAuthStrategyConfig {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } =
    process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "Missing Google OAuth env vars (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)",
    );
  }

  return {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
  };
}

export default passport;
