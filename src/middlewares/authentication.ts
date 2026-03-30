import { Request } from "express";
import jwt from "jsonwebtoken";
// import { redisClient } from '../config/redis'; // later

const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtPayload {
  sub: number;
  jti: string;
  type: "access" | "refresh";
  role?: string;
}

export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[],
): Promise<any> {
  if (securityName !== "jwt") {
    throw new Error("Unknown authentication type");
  }

  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split(" ")[1];

  let decoded: JwtPayload;

  try {
    decoded = jwt.verify(token!, JWT_SECRET) as unknown as JwtPayload;
  } catch (err) {
    throw new Error("Unauthorized");
  }

  // 🔴 IMPORTANT: reject refresh tokens for protected routes
  if (decoded.type !== "access") {
    throw new Error("Unauthorized");
  }

  // 🔴 Redis blacklist check (add later)
  /*
  const isBlacklisted = await redisClient.get(`blacklist:${decoded.jti}`);
  if (isBlacklisted) {
    throw new Error('Unauthorized');
  }
  */

  // 🔴 Role-based authorization
  if (scopes && scopes.length > 0) {
    if (!decoded.role || !scopes.includes(decoded.role)) {
      throw new Error("Forbidden");
    }
  }

  // Attach user to request (optional but useful)
  (request as any).user = decoded;

  return decoded;
}
