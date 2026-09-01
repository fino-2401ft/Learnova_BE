-- Tìm người dùng theo username, cho màn hình "chọn người để nhắn tin".
--
-- CẢNH BÁO CHO LẦN `prisma migrate dev` TIẾP THEO: index dưới đây Prisma không sinh
-- được từ schema.prisma, nên nó coi đây là sai lệch và sẽ chèn
--   DROP INDEX "users_username_trgm_idx";
-- vào đầu migration mới. Phải gỡ dòng đó bằng tay — giống hệt cách đã làm với
-- "courses_title_trgm_idx" ở các migration 20260823, 20260824.
--
-- VÌ SAO CẦN: `UsersRepository.searchByUsername` chạy
--   WHERE username ILIKE '%term%'
-- Dấu % ở ĐẦU chuỗi làm index B-tree của UNIQUE(username) vô hiệu hoàn toàn —
-- Postgres quét toàn bảng users cho mỗi ký tự người dùng gõ vào ô tìm kiếm.
-- Index trigram xử lý được wildcard hai đầu, và cho phép tìm gần đúng khi gõ sai.
--
-- Extension đã được tạo ở migration 20260821000001_raw_indexes; câu lệnh dưới đây
-- giữ lại IF NOT EXISTS để migration này chạy độc lập được trên một DB mới.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "users_username_trgm_idx" ON "users" USING GIN ("username" gin_trgm_ops);
