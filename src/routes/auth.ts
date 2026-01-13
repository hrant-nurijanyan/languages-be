import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import { prisma } from '../lib/prisma';
import { verifyPassword } from '../utils/password';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/auth/login', async (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parseResult.error.flatten() });
  }

  const { email, password } = parseResult.data;
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: '1h',
  });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

router.post('/auth/logout', authenticate, async (_req: AuthenticatedRequest, res) => {
  return res.json({ message: 'Logged out' });
});

router.get('/auth/profile', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    },
  });
});

export { router as authRouter };
