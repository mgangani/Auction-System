import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport, { getGoogleOAuthEnv } from "../config/passport";

let registered = false;

export function useGoogleStrategy(): void {
  if (registered) return;
  registered = true;

  passport.use(
    new GoogleStrategy(
      getGoogleOAuthEnv(),
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          return done(null, {
            email,
            name: profile.displayName,
            googleId: profile.id,
          });
        } catch (err) {
          return done(err, false);
        }
      },
    ),
  );
}

export const googleOAuthInitiate = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleOAuthCallback = passport.authenticate("google", {
  session: false,
});
