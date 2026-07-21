import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtUserPayload {
  userId: string;
  role: string;
}

export function signToken(payload: JwtUserPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as unknown as JwtUserPayload;
}
