/*
  Warnings:

  - The values [DEPUTY,METHODIST,INSPECTOR,ADMIN,TEACHER] on the enum `ControllerType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `capacity` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `gradeLevel` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `presentTeachersCount` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `recommendations` on the `Feedback` table. All the data in the column will be lost.
  - Added the required column `classId` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamLeaderId` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ControllerType_new" AS ENUM ('DIRECTOR', 'DEPUTY_UC', 'DEPUTY_VP', 'DEPUTY_NMR', 'DEPUTY_VS');
ALTER TABLE "Event" ALTER COLUMN "controllerType" TYPE "ControllerType_new" USING ("controllerType"::text::"ControllerType_new");
ALTER TYPE "ControllerType" RENAME TO "ControllerType_old";
ALTER TYPE "ControllerType_new" RENAME TO "ControllerType";
DROP TYPE "ControllerType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_teacherId_fkey";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "capacity",
DROP COLUMN "gradeLevel";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "lessonId",
DROP COLUMN "teacherId",
ADD COLUMN     "classId" INTEGER NOT NULL,
ADD COLUMN     "teamLeaderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "comments",
DROP COLUMN "presentTeachersCount",
DROP COLUMN "recommendations",
ADD COLUMN     "commentsTable1" TEXT,
ADD COLUMN     "commentsTable2" TEXT,
ADD COLUMN     "commentsTable3" TEXT,
ADD COLUMN     "recommendationsTable1" TEXT,
ADD COLUMN     "recommendationsTable2" TEXT,
ADD COLUMN     "recommendationsTable3" TEXT;

-- CreateTable
CREATE TABLE "EventParticipant" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipant_eventId_teacherId_key" ON "EventParticipant"("eventId", "teacherId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
