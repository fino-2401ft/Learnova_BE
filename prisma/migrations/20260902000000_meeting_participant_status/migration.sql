-- Quyền vào phòng họp.
--
-- Người thuộc khoá học vào thẳng; người NGOÀI khoá gõ cửa và chờ chủ phòng duyệt. Cột
-- này là chỗ ghi lại câu trả lời đó.
--
-- Mặc định ADMITTED chứ không phải PENDING, có chủ ý: đường đi thường gặp là thành
-- viên của khoá tự bấm vào phòng, và với họ thì không có bước duyệt nào cả. Chỉ nhánh
-- người ngoài mới ghi PENDING một cách tường minh. Đặt mặc định ngược lại sẽ khiến một
-- chỗ nào đó quên set trạng thái là cả lớp bị kẹt ngoài cửa.
--
-- Mặc định này cũng làm cho các dòng đã có (nếu có) trở thành ADMITTED — đúng, vì
-- trước khi có cột này thì mọi dòng meeting_participants đều là người đã được vào.

CREATE TYPE "MeetingParticipantStatus" AS ENUM ('PENDING', 'ADMITTED', 'REJECTED');

ALTER TABLE "meeting_participants"
  ADD COLUMN "status" "MeetingParticipantStatus" NOT NULL DEFAULT 'ADMITTED';

-- Phục vụ màn hình "ai đang chờ duyệt" của chủ phòng: truy vấn luôn lọc theo phòng và
-- theo trạng thái PENDING, chạy lại mỗi lần có người gõ cửa.
CREATE INDEX "meeting_participants_room_status_idx"
  ON "meeting_participants" ("meeting_room_id", "status");
