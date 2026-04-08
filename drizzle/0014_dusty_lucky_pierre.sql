ALTER TABLE "skills" ADD COLUMN "category" varchar(50) NOT NULL DEFAULT 'other';
ALTER TABLE "skills" ALTER COLUMN "category" DROP DEFAULT;