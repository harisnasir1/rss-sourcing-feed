import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/User_types'; // adjust path

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = '7d';

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};