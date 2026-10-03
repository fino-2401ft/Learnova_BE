import {
  MeetingParticipantRole,
  MeetingParticipantStatus,
  MeetingStatus,
  RecordingStatus,
} from '@prisma/client';

/** Người, hiển thị cạnh một ô video hoặc một hàng chờ duyệt. Cùng hình dạng với
 *  MessageAuthorDto để frontend dùng lại đúng component avatar đang có. */
export interface MeetingUserDto {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

export interface MeetingParticipantDto {
  user: MeetingUserDto;
  role: MeetingParticipantRole;
  status: MeetingParticipantStatus;
  /** Đã từng vào phòng lúc nào. `null` nghĩa là được duyệt nhưng chưa vào. */
  joinedAt: Date | null;
  leftAt: Date | null;
}

export interface MeetingDto {
  meetingRoomId: string;
  /** `null` với buổi tư vấn 1-1 nằm ngoài mọi khoá học. */
  courseId: string | null;
  courseTitle: string | null;
  title: string;
  description: string | null;
  status: MeetingStatus;

  scheduledStartAt: Date;
  /** Gia hạn ghi đè chính trường này — xem ExtendMeetingDto. */
  scheduledEndAt: Date;
  actualStartAt: Date | null;
  actualEndAt: Date | null;

  host: MeetingUserDto;
  /** Người xem có phải chủ phòng không. Quyết định giao diện hiện nút gia hạn, nút
   *  đóng phòng và danh sách chờ duyệt — frontend không phải tự so `host.userId`. */
  isHost: boolean;
  /** Quyền vào phòng của chính người đang xem. `null` khi chưa từng gõ cửa. */
  myStatus: MeetingParticipantStatus | null;
  /** Số người đã được duyệt. Đủ để hiện "3 người tham gia" mà không phải tải cả
   *  danh sách vào màn hình liệt kê. */
  admittedCount: number;
  /** Chỉ có giá trị với chủ phòng, và chỉ khi có người đang chờ. */
  pendingCount: number;
}

/**
 * Vé vào phòng: mọi thứ trình duyệt cần để nối tới SFU.
 *
 * `token` đã đóng dấu sẵn danh tính và quyền (được nói hay chỉ được nghe), nên sau khi
 * nó rời server thì không kiểm tra lại được nữa — xem LivekitService.createAccessToken.
 */
export interface MeetingAccessDto {
  /** wss://... của LiveKit. */
  serverUrl: string;
  token: string;
  /** Tên phòng bên LiveKit, chính là `meetingCode`. Frontend hiếm khi cần, nhưng nó
   *  làm cho log ở hai phía khớp nhau khi có sự cố. */
  roomName: string;
  meeting: MeetingDto;
}

/** Trả về khi người ngoài khoá gõ cửa và chủ phòng chưa trả lời. Không phải lỗi —
 *  đây là một trạng thái bình thường mà giao diện phải vẽ ra màn hình chờ. */
export interface MeetingPendingDto {
  status: typeof MeetingParticipantStatus.PENDING;
  meeting: MeetingDto;
}

/** Một lần ghi hình. */
export interface RecordingDto {
  recordingId: string;
  status: RecordingStatus;
  /** Chỉ có giá trị khi status = READY. Trước đó LiveKit còn đang ghép và tải file,
   *  và một đường link dựng sớm chỉ là link 404. */
  url: string | null;
  durationSec: number | null;
  /** Đổi từ BigInt sang Number ở tầng này: BigInt không đi qua JSON.stringify được,
   *  và Number chính xác tới 9 PB — thừa cho một file video. */
  sizeBytes: number | null;
  startedAt: Date;
  endedAt: Date | null;
  /** Chỉ hiện cho chủ phòng: học viên không làm được gì với thông báo lỗi của
   *  LiveKit, còn giảng viên thì cần biết vì sao buổi học không ghi được. */
  error: string | null;
}

/** Một dòng trong Meeting History của khoá học. */
export interface MeetingHistoryDto {
  meeting: MeetingDto;
  recordings: RecordingDto[];
}
