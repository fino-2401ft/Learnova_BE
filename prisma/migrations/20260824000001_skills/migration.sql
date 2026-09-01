-- DANH MỤC KỸ NĂNG cho hồ sơ năng lực của mentee.
--
-- `skill_chapters` gán ở mức CHƯƠNG, không phải mức bài: đơn vị mà lộ trình bỏ qua
-- là cả chương, nên gán tới từng bài chỉ làm phồng số câu hỏi phải soạn cho bài
-- kiểm tra đầu vào mà không đổi được điều gì.
--
-- LƯU Ý CHO LẦN SINH MIGRATION SAU: `prisma migrate diff` luôn kèm thêm dòng
--   DROP INDEX "courses_title_trgm_idx";
-- Phải gỡ dòng đó bằng tay. Index trgm được tạo ở migration 20260821000001_raw_indexes
-- bằng SQL thuần; Prisma không biết nó tồn tại nên tưởng là rác cần dọn.

-- CreateTable
CREATE TABLE "skills" (
    "skill_id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "domain" VARCHAR(60) NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("skill_id")
);

-- CreateTable
CREATE TABLE "skill_chapters" (
    "skill_id" UUID NOT NULL,
    "chapter_id" UUID NOT NULL,

    CONSTRAINT "skill_chapters_pkey" PRIMARY KEY ("skill_id","chapter_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skills_code_key" ON "skills"("code");

-- CreateIndex
CREATE UNIQUE INDEX "skills_order_index_key" ON "skills"("order_index");

-- CreateIndex
CREATE INDEX "skill_chapters_chapter_id_idx" ON "skill_chapters"("chapter_id");

-- AddForeignKey
ALTER TABLE "skill_chapters" ADD CONSTRAINT "skill_chapters_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("skill_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_chapters" ADD CONSTRAINT "skill_chapters_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("chapter_id") ON DELETE CASCADE ON UPDATE CASCADE;

