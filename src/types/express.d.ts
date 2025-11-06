import { JwtPayload } from '../types/User_types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}