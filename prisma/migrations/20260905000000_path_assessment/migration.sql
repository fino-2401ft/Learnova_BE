-- Bài kiểm tra đầu vào của lộ trình, và điểm từng kỹ năng dùng để cá nhân hoá.
--
-- Câu hỏi KHÔNG soạn mới: chúng được bốc từ ngân hàng quiz sẵn có của các bài học,
-- và nhãn kỹ năng suy ra qua chuỗi Skill → SkillChapter → Chapter → Lesson →
-- QuizQuestion. Nhờ vậy 442 câu đã có sẵn trở thành đề thi mà không phải viết thêm.

CREATE TYPE "AssessmentStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

CREATE TABLE "path_assessments" (
  "assessment_id"    UUID NOT NULL,
  "user_id"          UUID NOT NULL,
  "learning_path_id" UUID NOT NULL,
  "status"           "AssessmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "started_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submitted_at"     TIMESTAMPTZ(6),

  CONSTRAINT "path_assessments_pkey" PRIMARY KEY ("assessment_id")
);

-- Tra "lần làm gần nhất của người này trong lộ trình này", chạy mỗi lần mở lộ trình.
CREATE INDEX "path_assessments_user_path_idx"
  ON "path_assessments" ("user_id", "learning_path_id", "submitted_at");

-- Đề đã phát, kèm câu trả lời.
--
-- VÌ SAO PHẢI LƯU: câu hỏi bốc NGẪU NHIÊN. Bốc lại mỗi lần client hỏi thì người làm
-- bài thấy một bộ đề khác sau mỗi lần tải lại trang, và câu đã trả lời biến mất.
CREATE TABLE "assessment_questions" (
  "assessment_id"      UUID    NOT NULL,
  "question_id"        UUID    NOT NULL,
  -- Chốt tại thời điểm phát đề. Một chương được gán lại kỹ năng khác giữa lúc người
  -- ta đang làm bài sẽ làm điểm nhảy sang kỹ năng khác nếu suy lại lúc chấm.
  "skill_id"           UUID    NOT NULL,
  "order_index"        INTEGER NOT NULL,
  -- NULL = chưa trả lời. Bỏ trống tính là sai khi chấm.
  "selected_option_id" UUID,
  "is_correct"         BOOLEAN,

  CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("assessment_id", "question_id")
);

CREATE UNIQUE INDEX "assessment_questions_order_key"
  ON "assessment_questions" ("assessment_id", "order_index");
CREATE INDEX "assessment_questions_question_id_idx"
  ON "assessment_questions" ("question_id");
CREATE INDEX "assessment_questions_skill_id_idx"
  ON "assessment_questions" ("skill_id");

-- Kết quả đã chốt, ghi lúc nộp bài.
--
-- Lưu thay vì đếm lại từ assessment_questions mỗi lần đọc: bảng này được đọc ở mọi
-- lần mở lộ trình, và phải giữ nguyên ngay cả khi câu hỏi gốc bị sửa hoặc bài học bị
-- xoá sau đó.
CREATE TABLE "assessment_skill_scores" (
  "assessment_id" UUID    NOT NULL,
  "skill_id"      UUID    NOT NULL,
  "correct"       INTEGER NOT NULL,
  "total"         INTEGER NOT NULL,

  CONSTRAINT "assessment_skill_scores_pkey" PRIMARY KEY ("assessment_id", "skill_id")
);

CREATE INDEX "assessment_skill_scores_skill_id_idx"
  ON "assessment_skill_scores" ("skill_id");

ALTER TABLE "path_assessments"
  ADD CONSTRAINT "path_assessments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "path_assessments"
  ADD CONSTRAINT "path_assessments_learning_path_id_fkey"
  FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("learning_path_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assessment_questions"
  ADD CONSTRAINT "assessment_questions_assessment_id_fkey"
  FOREIGN KEY ("assessment_id") REFERENCES "path_assessments"("assessment_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assessment_questions"
  ADD CONSTRAINT "assessment_questions_question_id_fkey"
  FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assessment_questions"
  ADD CONSTRAINT "assessment_questions_skill_id_fkey"
  FOREIGN KEY ("skill_id") REFERENCES "skills"("skill_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assessment_skill_scores"
  ADD CONSTRAINT "assessment_skill_scores_assessment_id_fkey"
  FOREIGN KEY ("assessment_id") REFERENCES "path_assessments"("assessment_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assessment_skill_scores"
  ADD CONSTRAINT "assessment_skill_scores_skill_id_fkey"
  FOREIGN KEY ("skill_id") REFERENCES "skills"("skill_id") ON DELETE CASCADE ON UPDATE CASCADE;
