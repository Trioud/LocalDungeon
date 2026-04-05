-- Add classLevels JSON field to store per-class level tracking
ALTER TABLE "characters" ADD COLUMN "class_levels" JSONB;

-- Add totalLevel computed sum field
ALTER TABLE "characters" ADD COLUMN "total_level" INTEGER;
