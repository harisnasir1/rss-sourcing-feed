import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
    return;
  }

  req.user = decoded;
  next();
};

export const isAdmin=(req:Request,res:Response,next:NextFunction)=>{
  if(req.user?.role!=='admin')
  {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}