import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { HttpError } from "../utils/httpError";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authentication required"));
  }

  try {
    req.user = verifyToken(header.replace("Bearer ", ""));
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have access to this resource"));
    }
    next();
  };
}
