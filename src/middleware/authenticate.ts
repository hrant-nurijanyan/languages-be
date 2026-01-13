import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { SafeUser } from '../types/user';

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  const token = header.replace('Bearer ', '').trim();

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
