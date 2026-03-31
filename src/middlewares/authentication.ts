import { Request } from "express";
import jwt from "jsonwebtoken";

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

  if (decoded.type !== "access") {
    throw new Error("Unauthorized");
  }

  if (scopes && scopes.length > 0) {
    if (!decoded.role || !scopes.includes(decoded.role)) {
      throw new Error("Forbidden");
    }
  }
  (request as any).user = decoded;

  return decoded;
}
