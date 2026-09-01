-- LỘ TRÌNH HỌC: vị trí của khoá trong tuyến "NodeJS Backend Developer".
--
-- NULL = khoá không thuộc lộ trình (khoá nháp, khoá mentor tự soạn). Postgres cho
-- phép nhiều NULL dưới một ràng buộc UNIQUE, nên cột vừa duy nhất vừa tuỳ chọn.
--
-- LƯU Ý CHO LẦN SINH MIGRATION SAU: `prisma migrate diff` luôn kèm thêm dòng
--   DROP INDEX "courses_title_trgm_idx";
-- Phải gỡ dòng đó bằng tay. Index trgm được tạo ở migration 20260821000001_raw_indexes
-- bằng SQL thuần; Prisma không biết nó tồn tại nên tưởng là rác cần dọn.

ALTER TABLE "courses" ADD COLUMN "path_order" INTEGER;

CREATE UNIQUE INDEX "courses_path_order_key" ON "courses"("path_order");
