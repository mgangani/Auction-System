import type { NextFunction, Request, Response } from "express";
import { ValidateError } from "@tsoa/runtime";

function mapErrorToStatus(err: any): number {
  if (typeof err?.status === "number") {
    return err.status;
  }

  const message = String(err?.message || "").toLowerCase();

  if (message.includes("unauthorized") || message.includes("invalid credentials") || message.includes("invalid refresh token")) {
    return 401;
  }

  if (message.includes("forbidden")) {
    return 403;
  }

  if (message.includes("not found")) {
    return 404;
  }

  if (message.includes("already in use") || message.includes("missing") || message.includes("invalid status") || message.includes("cannot")) {
    return 400;
  }

  return 500;
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof ValidateError) {
    return res.status(422).json({
      message: "Validation Failed",
      details: err?.fields,
    });
  }

  const status = mapErrorToStatus(err);

  return res.status(status).json({
    message: err?.message || "Internal Server Error",
  });
}

