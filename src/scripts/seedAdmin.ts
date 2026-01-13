import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
const name = process.env.SEED_ADMIN_NAME ?? 'Admin User';

async function seedAdmin() {
  const { hash, salt } = hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: 'admin',
      passwordHash: hash,
      salt,
    },
    create: {
      email,
      name,
      role: 'admin',
      passwordHash: hash,
      salt,
    },
  });

  console.log(`✅ Admin user ready: ${email} / ${password}`);
  return admin;
}

async function seedLessons(authorId: string) {
  await prisma.lesson.upsert({
    where: { id: 'seed-lesson-1' },
    update: {},
    create: {
      id: 'seed-lesson-1',
      title: 'Ordering Coffee',
      description: 'Teach learners how to order coffee politely.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId,
      tasks: {
        create: [
          {
            id: 'seed-task-1',
            prompt: 'Choose the correct phrase to order a latte.',
            type: 'PICK_ONE',
            order: 1,
            config: {
              hints: ['Start with a greeting'],
            },
            options: {
              create: [
                { label: 'Give me a latte.', isCorrect: false },
                { label: 'Could I have a latte, please?', isCorrect: true },
              ],
            },
          },
          {
            id: 'seed-task-2',
            prompt: 'Fill in the blank: "I would like a ___ cappuccino."',
            type: 'FILL_IN_BLANK',
            order: 2,
            config: {
              correctAnswers: ['small'],
            },
          },
        ],
      },
    },
  });

  const taskCount = await prisma.task.count({ where: { lessonId: 'seed-lesson-1' } });
  console.log(`📘 Seeded lesson "Ordering Coffee" with ${taskCount} tasks.`);
}

async function seedVocabulary(authorId: string) {
  await prisma.vocabularyEntry.upsert({
    where: { id: 'vocab-hello-1' },
    update: {},
    create: {
      id: 'vocab-hello-1',
      englishText: 'Hello',
      kind: 'WORD',
      notes: 'Basic greeting',
      createdById: authorId,
      translations: {
        create: [
          { languageCode: 'es', translation: 'Hola' },
          { languageCode: 'fr', translation: 'Bonjour' },
        ],
      },
    },
  });

  await prisma.vocabularyEntry.upsert({
    where: { id: 'vocab-how-are-you' },
    update: {},
    create: {
      id: 'vocab-how-are-you',
      englishText: 'How are you?',
      kind: 'PHRASE',
      createdById: authorId,
      notes: 'Common polite question',
      translations: {
        create: [
          { languageCode: 'es', translation: '¿Cómo estás?' },
          { languageCode: 'fr', translation: 'Comment ça va ?' },
        ],
      },
    },
  });

  console.log('🗂 Seeded vocabulary entries with translations.');
}

async function main() {
  const admin = await seedAdmin();
  await seedLessons(admin.id);
  await seedVocabulary(admin.id);
}

main()
  .catch((error) => {
    console.error('Failed to seed admin user', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
