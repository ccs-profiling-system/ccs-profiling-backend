-- Step 1: Add instruction_id column
ALTER TABLE "schedules" ADD COLUMN "instruction_id" uuid;
--> statement-breakpoint

-- Step 2: Data migration - Populate instruction_id from subject_id
-- Match schedules to instructions where subject codes align
UPDATE schedules s
SET instruction_id = i.id
FROM subjects sub
JOIN instructions i ON i.subject_code = sub.code
WHERE s.subject_id = sub.id
  AND s.instruction_id IS NULL;
--> statement-breakpoint

-- Step 3: Add foreign key constraint for instruction_id
DO $ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_instruction_id_instructions_id_fk" FOREIGN KEY ("instruction_id") REFERENCES "instructions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $;
--> statement-breakpoint

-- Step 4: Add index for query performance
CREATE INDEX IF NOT EXISTS "schedules_instruction_id_idx" ON "schedules" ("instruction_id");
--> statement-breakpoint

-- Step 5: Remove subject_id (now redundant - can be derived via instruction)
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_subject_id_subjects_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "schedules_subject_id_idx";
--> statement-breakpoint
ALTER TABLE "schedules" DROP COLUMN IF EXISTS "subject_id";
