-- Lộ trình nghề: "NodeJS Backend Developer", "React Frontend Developer".
--
-- Trước đây lộ trình là ngầm định — chỉ có cột `courses.path_order` và đúng MỘT dãy
-- khoá học. Hai bảng dưới đây làm nó thành thứ đếm được, và cho phép một khoá nằm
-- trong nhiều lộ trình (TypeScript là bước 2 của backend, bước 7 của frontend).
--
-- `courses.path_order` KHÔNG bị xoá ở migration này: bảng điều khiển phía frontend
-- còn đọc nó. Nó thôi làm nguồn sự thật — importer suy ra nó từ lộ trình backend nên
-- hai nơi không thể lệch. Xoá cột được sau khi frontend chuyển sang API lộ trình.

CREATE TABLE "learning_paths" (
  "learning_path_id" UUID         NOT NULL,
  "slug"             VARCHAR(60)  NOT NULL,
  "title"            VARCHAR(120) NOT NULL,
  "description"      TEXT         NOT NULL,
  -- TÊN icon để frontend tra sang component, không phải URL: bộ icon nằm trong mã
  -- nguồn frontend nên lưu URL ở đây sẽ trỏ ra một thứ không tồn tại.
  "icon"             VARCHAR(40)  NOT NULL,
  "order_index"      INTEGER      NOT NULL,
  "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("learning_path_id")
);

CREATE UNIQUE INDEX "learning_paths_slug_key" ON "learning_paths" ("slug");
CREATE UNIQUE INDEX "learning_paths_order_index_key" ON "learning_paths" ("order_index");

CREATE TABLE "learning_path_courses" (
  "learning_path_id" UUID    NOT NULL,
  "course_id"        UUID    NOT NULL,
  "order_index"      INTEGER NOT NULL,

  CONSTRAINT "learning_path_courses_pkey" PRIMARY KEY ("learning_path_id", "course_id")
);

-- Hai khoá không được cùng giữ một vị trí trong CÙNG một lộ trình. Khác lộ trình thì
-- trùng số thoải mái — đó chính là điều cột `path_order` cũ không cho phép, vì nó
-- UNIQUE trên toàn bảng courses.
CREATE UNIQUE INDEX "learning_path_courses_path_order_key"
  ON "learning_path_courses" ("learning_path_id", "order_index");

CREATE INDEX "learning_path_courses_course_id_idx"
  ON "learning_path_courses" ("course_id");

ALTER TABLE "learning_path_courses"
  ADD CONSTRAINT "learning_path_courses_learning_path_id_fkey"
  FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("learning_path_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "learning_path_courses"
  ADD CONSTRAINT "learning_path_courses_course_id_fkey"
  FOREIGN KEY ("course_id") REFERENCES "courses"("course_id")
  ON DELETE CASCADE ON UPDATE CASCADE;
