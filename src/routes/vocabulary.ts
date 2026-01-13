import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';

const router = Router();

const baseEntrySchema = z.object({
  englishText: z.string().min(1),
  kind: z.enum(['WORD', 'PHRASE', 'SENTENCE']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const translationSchema = z.object({
  languageCode: z.string().min(2),
  translation: z.string().min(1),
  usageExample: z.string().optional(),
});

router.get('/vocabulary', authenticate, async (_req: AuthenticatedRequest, res) => {
  const entries = await prisma.vocabularyEntry.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { translations: true },
  });
  return res.json({ entries });
});

router.get('/vocabulary/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  const entry = await prisma.vocabularyEntry.findUnique({
    where: { id: req.params.id },
    include: { translations: true },
  });
  if (!entry) return res.status(404).json({ message: 'Vocabulary entry not found' });
  return res.json({ entry });
});

router.post('/vocabulary', authenticate, async (req: AuthenticatedRequest, res) => {
  const parsed = baseEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  const translations = Array.isArray(req.body.translations)
    ? z.array(translationSchema).safeParse(req.body.translations)
    : null;

  if (translations && !translations.success) {
    return res.status(400).json({ message: 'Invalid translations', issues: translations.error.flatten() });
  }

  const created = await prisma.vocabularyEntry.create({
    data: {
      englishText: parsed.data.englishText,
      kind: parsed.data.kind ?? 'WORD',
      notes: parsed.data.notes,
      tags: parsed.data.tags ?? [],
      createdById: req.user?.id,
      translations: translations?.data
        ? { create: translations.data.map((t) => ({ ...t })) }
        : undefined,
    },
    include: { translations: true },
  });

  return res.status(201).json({ entry: created });
});

router.patch('/vocabulary/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  const parsed = baseEntrySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  const existing = await prisma.vocabularyEntry.findUnique({
    where: { id: req.params.id },
    include: { translations: true },
  });
  if (!existing) return res.status(404).json({ message: 'Vocabulary entry not found' });

  const updated = await prisma.vocabularyEntry.update({
    where: { id: req.params.id },
    data: {
      englishText: parsed.data.englishText ?? existing.englishText,
      notes: parsed.data.notes ?? existing.notes,
      tags: parsed.data.tags ?? existing.tags,
      kind: parsed.data.kind ?? existing.kind,
    },
    include: { translations: true },
  });

  return res.json({ entry: updated });
});

router.delete('/vocabulary/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    await prisma.vocabularyEntry.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (error) {
    return res.status(404).json({ message: 'Vocabulary entry not found' });
  }
});

router.post(
  '/vocabulary/:id/translations',
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    const parsed = translationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
    }

    const entry = await prisma.vocabularyEntry.findUnique({ where: { id: req.params.id } });
    if (!entry) {
      return res.status(404).json({ message: 'Vocabulary entry not found' });
    }

    const translation = await prisma.vocabularyTranslation.create({
      data: {
        entryId: entry.id,
        languageCode: parsed.data.languageCode,
        translation: parsed.data.translation,
        usageExample: parsed.data.usageExample,
      },
    });

    return res.status(201).json({ translation });
  },
);

router.patch(
  '/vocabulary/:entryId/translations/:translationId',
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    const parsed = translationSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
    }

    const translation = await prisma.vocabularyTranslation.findFirst({
      where: { id: req.params.translationId, entryId: req.params.entryId },
    });
    if (!translation) {
      return res.status(404).json({ message: 'Translation not found' });
    }

    const updated = await prisma.vocabularyTranslation.update({
      where: { id: translation.id },
      data: {
        languageCode: parsed.data.languageCode ?? translation.languageCode,
        translation: parsed.data.translation ?? translation.translation,
        usageExample: parsed.data.usageExample ?? translation.usageExample,
      },
    });

    return res.json({ translation: updated });
  },
);

router.delete(
  '/vocabulary/:entryId/translations/:translationId',
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    const translation = await prisma.vocabularyTranslation.findFirst({
      where: { id: req.params.translationId, entryId: req.params.entryId },
    });
    if (!translation) {
      return res.status(404).json({ message: 'Translation not found' });
    }
    await prisma.vocabularyTranslation.delete({ where: { id: translation.id } });
    return res.status(204).send();
  },
);

export { router as vocabularyRouter };
