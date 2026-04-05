/*
  Warnings:

  - The `size` column on the `species` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "species" DROP COLUMN "size",
ADD COLUMN     "size" TEXT[];
