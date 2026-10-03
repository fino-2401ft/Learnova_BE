-- Ghi hình buổi họp, để xem lại trong Meeting History của khoá học.
--
-- Byte của video KHÔNG đi qua backend này: LiveKit ghi ở phía server rồi tự tải thẳng
-- lên Supabase Storage qua giao thức S3. Bảng dưới đây chỉ giữ phần siêu dữ liệu —
-- đang ghi hay xong, file nằm ở đâu, dài bao nhiêu.

CREATE TYPE "RecordingStatus" AS ENUM ('RECORDING', 'PROCESSING', 'READY', 'FAILED');

CREATE TABLE "meeting_recordings" (
  "recording_id"    UUID         NOT NULL,
  "meeting_room_id" UUID         NOT NULL,
  "egress_id"       VARCHAR(64)  NOT NULL,
  "status"          "RecordingStatus" NOT NULL DEFAULT 'RECORDING',
  "url"             TEXT,
  "storage_key"     TEXT,
  "duration_sec"    INTEGER,
  -- BIGINT: một buổi 8 tiếng có thể vượt trần 2GB của INTEGER.
  "size_bytes"      BIGINT,
  "started_at"      TIMESTAMPTZ(6) NOT NULL,
  "ended_at"        TIMESTAMPTZ(6),
  "error"           TEXT,
  "created_at"      TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "meeting_recordings_pkey" PRIMARY KEY ("recording_id")
);

-- Khoá đối chiếu với LiveKit. UNIQUE để mỗi lần job đồng bộ trạng thái không sinh
-- thêm một hàng trùng cho cùng một tiến trình ghi.
CREATE UNIQUE INDEX "meeting_recordings_egress_id_key"
  ON "meeting_recordings" ("egress_id");

CREATE INDEX "meeting_recordings_meeting_room_id_idx"
  ON "meeting_recordings" ("meeting_room_id");

-- Job đối chiếu chỉ quét RECORDING và PROCESSING; index này giữ cho nó không phải
-- duyệt toàn bảng mỗi phút khi lịch sử đã dài ra.
CREATE INDEX "meeting_recordings_status_idx"
  ON "meeting_recordings" ("status");

-- CASCADE: xoá phòng họp thì bản ghi siêu dữ liệu đi theo. File trên Supabase KHÔNG
-- tự mất — đó là chủ ý, xem ghi chú đầu file recording.service.ts.
ALTER TABLE "meeting_recordings"
  ADD CONSTRAINT "meeting_recordings_meeting_room_id_fkey"
  FOREIGN KEY ("meeting_room_id") REFERENCES "meeting_rooms"("meeting_room_id")
  ON DELETE CASCADE ON UPDATE CASCADE;
