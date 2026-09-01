-- Tach noi dung bai hoc ra khoi mot cot Markdown duy nhat.
--
-- LUU Y khi sinh lai file nay bang `prisma migrate diff`: lenh do KHONG biet ve
-- cac index viet tay o migration 20260821000001_raw_indexes (courses_title_trgm_idx
-- va users_email_lower_key), nen no sinh them mot cau `DROP INDEX
-- "courses_title_trgm_idx"`. Cau do da bi go bo thu cong khoi file nay. Bat cu ai
-- sinh lai migration bang diff deu phai kiem tra va go lai.

-- CreateEnum
CREATE TYPE "LessonSectionKind" AS ENUM ('OBJECTIVES', 'DEFINITION', 'SYNTAX', 'EXAMPLE', 'NOTES', 'REAL_WORLD', 'MISTAKES', 'SUMMARY');

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "content_md";

-- CreateTable
CREATE TABLE "lesson_sections" (
    "section_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "kind" "LessonSectionKind" NOT NULL,
    "heading" VARCHAR(300),
    "content_md" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lesson_sections_pkey" PRIMARY KEY ("section_id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "question_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "prompt_md" TEXT NOT NULL,
    "explanation_md" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "quiz_options" (
    "option_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "label" CHAR(1) NOT NULL,
    "content_md" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("option_id")
);

-- CreateIndex
CREATE INDEX "lesson_sections_lesson_id_kind_idx" ON "lesson_sections"("lesson_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_sections_lesson_id_order_index_key" ON "lesson_sections"("lesson_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_lesson_id_order_index_key" ON "quiz_questions"("lesson_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_options_question_id_label_key" ON "quiz_options"("question_id", "label");

-- AddForeignKey
ALTER TABLE "lesson_sections" ADD CONSTRAINT "lesson_sections_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

