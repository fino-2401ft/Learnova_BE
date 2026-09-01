-- Đính kèm ảnh / video / file vào tin nhắn.
--
-- Mô hình: MỘT message mang ĐÚNG MỘT file, và `messages.content` chính là URL công
-- khai của file đó (với message TEXT thì content vẫn là nội dung chữ như cũ). Gửi ba
-- ảnh nghĩa là ba message — giống cách Messenger/Zalo xếp bong bóng chat, và giữ cho
-- con trỏ phân trang theo `message_id` vẫn đúng mà không cần bảng phụ.
--
-- CẢNH BÁO CHO LẦN `prisma migrate dev` TIẾP THEO: như đã ghi ở migration 20260828,
-- Prisma không biết các index trigram viết tay nên sẽ chèn DROP INDEX vào đầu
-- migration mới. Phải gỡ những dòng đó bằng tay.

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------

-- Postgres 12 trở lên cho phép ADD VALUE trong transaction (prisma migrate bọc mỗi
-- migration trong một transaction) MIỄN LÀ giá trị mới không được dùng ngay trong
-- cùng transaction đó. Ở đây chỉ khai báo, không INSERT, nên an toàn.
-- Máy dự án chạy Postgres 17, xem docker-compose.yml.
ALTER TYPE "MessageType" ADD VALUE 'VIDEO' AFTER 'IMAGE';

CREATE TYPE "StorageProvider" AS ENUM ('CLOUDINARY', 'SUPABASE');

-- ---------------------------------------------------------------------------
-- Cột đính kèm
-- ---------------------------------------------------------------------------

ALTER TABLE "messages"
  ADD COLUMN "attachment_name"   VARCHAR(255),
  ADD COLUMN "attachment_mime"   VARCHAR(150),
  ADD COLUMN "attachment_size"   INTEGER,
  ADD COLUMN "storage_provider"  "StorageProvider",
  ADD COLUMN "storage_key"       TEXT,
  ADD COLUMN "thumbnail_url"     TEXT;

-- Chống replay: mỗi upload ticket sinh ra một storage_key riêng, nên UNIQUE ở đây
-- biến "gửi lại cùng một ticket" thành lỗi 409 thay vì hai bong bóng chat trỏ về
-- cùng một file. Cột NULL với mọi message TEXT, và Postgres cho phép vô số NULL
-- trong một cột UNIQUE nên ràng buộc này không đụng gì tới tin nhắn chữ.
CREATE UNIQUE INDEX "messages_storage_key_key" ON "messages" ("storage_key");
