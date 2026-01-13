import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';

const router = Router();

router.get('/analytics/overview', authenticate, async (_req: AuthenticatedRequest, res) => {
  const [totalLessons, publishedLessons, totalTasks, latestLesson] = await Promise.all([
    prisma.lesson.count(),
    prisma.lesson.count({ where: { status: 'PUBLISHED' } }),
    prisma.task.count(),
    prisma.lesson.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: { title: true, publishedAt: true },
    }),
  ]);

  const draftLessons = totalLessons - publishedLessons;
  const avgTasksPerLesson = totalLessons > 0 ? Number((totalTasks / totalLessons).toFixed(1)) : 0;

  return res.json({
    stats: {
      totalLessons,
      publishedLessons,
      draftLessons,
      totalTasks,
      avgTasksPerLesson,
      latestPublishedLesson: latestLesson
        ? {
          title: latestLesson.title,
          publishedAt: latestLesson.publishedAt,
        }
        : null,
    },
  });
});

export { router as analyticsRouter };
