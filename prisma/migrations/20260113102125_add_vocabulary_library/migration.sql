-- CreateEnum
CREATE TYPE "VocabularyKind" AS ENUM ('WORD', 'PHRASE', 'SENTENCE');

-- CreateEnum
CREATE TYPE "LearnerWordStatus" AS ENUM ('NEW', 'REVIEWING', 'MASTERED');

-- CreateTable
CREATE TABLE "VocabularyEntry" (
    "id" TEXT NOT NULL,
    "englishText" TEXT NOT NULL,
    "kind" "VocabularyKind" NOT NULL DEFAULT 'WORD',
    "notes" TEXT,
    "tags" TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyTranslation" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "usageExample" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerVocabulary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "status" "LearnerWordStatus" NOT NULL DEFAULT 'NEW',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerVocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearnerVocabulary_userId_entryId_key" ON "LearnerVocabulary"("userId", "entryId");

-- AddForeignKey
ALTER TABLE "VocabularyEntry" ADD CONSTRAINT "VocabularyEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyTranslation" ADD CONSTRAINT "VocabularyTranslation_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "VocabularyEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerVocabulary" ADD CONSTRAINT "LearnerVocabulary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerVocabulary" ADD CONSTRAINT "LearnerVocabulary_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "VocabularyEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
