import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';

const router = Router();

const statusSchema = z.object({
  status: z.enum(['NEW', 'REVIEWING', 'MASTERED']),
});

router.get('/me/vocabulary', authenticate, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const learnerEntries = await prisma.learnerVocabulary.findMany({
    where: { userId: req.user.id },
    include: {
      entry: {
        include: { translations: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return res.json({ vocabulary: learnerEntries });
});

router.post('/me/vocabulary/:entryId', authenticate, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const entry = await prisma.vocabularyEntry.findUnique({ where: { id: req.params.entryId } });
  if (!entry) return res.status(404).json({ message: 'Vocabulary entry not found' });

  const learnerWord = await prisma.learnerVocabulary.upsert({
    where: { userId_entryId: { userId: req.user.id, entryId: entry.id } },
    update: {},
    create: {
      userId: req.user.id,
      entryId: entry.id,
      status: 'NEW',
    },
    include: { entry: { include: { translations: true } } },
  });

  return res.status(201).json({ vocabulary: learnerWord });
});

router.patch('/me/vocabulary/:entryId', authenticate, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  const learnerWord = await prisma.learnerVocabulary.findUnique({
    where: { userId_entryId: { userId: req.user.id, entryId: req.params.entryId } },
  });

  if (!learnerWord) {
    return res.status(404).json({ message: 'Learner vocabulary entry not found' });
  }

  const updated = await prisma.learnerVocabulary.update({
    where: { userId_entryId: { userId: req.user.id, entryId: req.params.entryId } },
    data: { status: parsed.data.status },
    include: { entry: { include: { translations: true } } },
  });

  return res.json({ vocabulary: updated });
});

router.delete('/me/vocabulary/:entryId', authenticate, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    await prisma.learnerVocabulary.delete({
      where: { userId_entryId: { userId: req.user.id, entryId: req.params.entryId } },
    });
    return res.status(204).send();
  } catch (error) {
    return res.status(404).json({ message: 'Learner vocabulary entry not found' });
  }
});

export { router as learnerVocabularyRouter };
