/*
  Warnings:

  - You are about to drop the column `gradeId` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `controllerId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the `Grade` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `gradeLevel` to the `Class` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_classId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_controllerId_fkey";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "gradeId",
ADD COLUMN     "gradeLevel" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "classId",
DROP COLUMN "controllerId";

-- DropTable
DROP TABLE "Grade";
