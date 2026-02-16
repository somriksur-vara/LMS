/*
  Warnings:

  - You are about to drop the column `categoryId` on the `books` table. All the data in the column will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "books" DROP CONSTRAINT "books_categoryId_fkey";

-- DropIndex
DROP INDEX "books_categoryId_idx";

-- AlterTable
ALTER TABLE "books" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "categories";
