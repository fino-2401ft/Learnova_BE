-- Hai index dưới đây Prisma không sinh được từ schema.prisma, phải viết tay.

-- 1. Chặn trùng email khác hoa thường.
--
-- UNIQUE(email) của Postgres phân biệt hoa thường, nên "An@gmail.com" và
-- "an@gmail.com" là hai dòng hợp lệ và cùng đăng ký được. Tầng ứng dụng đã chuẩn hóa
-- lowercase trong DTO, nhưng đó là kỷ luật chứ không phải ràng buộc — chỉ cần một
-- chỗ ghi thẳng vào DB (seed, script sửa dữ liệu) là thủng. Index này là chốt chặn thật.
CREATE UNIQUE INDEX "users_email_lower_key" ON "users" (LOWER("email"));

-- 2. Tìm khóa học theo tên.
--
-- Đây là con đường tìm kiếm duy nhất của hệ thống. Truy vấn dạng
-- `WHERE title ILIKE '%react%'` KHÔNG dùng được index B-tree vì dấu % ở đầu chuỗi làm
-- index vô hiệu — Postgres sẽ quét toàn bảng. Index trigram khắc phục điều đó, đồng
-- thời cho phép tìm gần đúng khi người dùng gõ sai chính tả.
--
-- Chọn trigram thay vì full-text search vì Postgres không có bộ phân tích tiếng Việt
-- sẵn: full-text sẽ tách từ theo khoảng trắng và bỏ lỡ nhiều trường hợp.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "courses_title_trgm_idx" ON "courses" USING GIN ("title" gin_trgm_ops);
