import { HttpStatus } from '@nestjs/common';

export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Courses. Each of these is a 403 or 409 that a generic code would flatten into
  // something the client cannot act on: "forbidden" does not tell the UI whether to
  // show an enroll button or a "course withdrawn" notice.
  COURSE_NOT_PUBLISHED: 'COURSE_NOT_PUBLISHED',
  ALREADY_ENROLLED: 'ALREADY_ENROLLED',
  NOT_ENROLLED: 'NOT_ENROLLED',
  QUIZ_ANSWER_INVALID: 'QUIZ_ANSWER_INVALID',

  // Authoring. A generic 409 would not tell the editor whether to unlock the form,
  // reload the tree, or send the mentor to their profile.
  MENTOR_NOT_APPROVED: 'MENTOR_NOT_APPROVED',
  COURSE_LOCKED: 'COURSE_LOCKED',
  COURSE_EMPTY: 'COURSE_EMPTY',
  REORDER_STALE: 'REORDER_STALE',
  HAS_LEARNER_PROGRESS: 'HAS_LEARNER_PROGRESS',

  // Messenger. "Forbidden" alone leaves the chat UI with nothing to do: it cannot
  // tell whether to hide the thread, grey out the composer, or offer a retry.
  NOT_A_PARTICIPANT: 'NOT_A_PARTICIPANT',
  MESSAGE_NOT_OWNED: 'MESSAGE_NOT_OWNED',
  CANNOT_MESSAGE_SELF: 'CANNOT_MESSAGE_SELF',

  // Attachments. The upload happens in the client against a third-party host, so
  // these are the only way the composer learns WHY its file was refused — a bare 400
  // cannot tell it to say "định dạng không hỗ trợ" versus "file quá 10MB" versus
  // "phiên tải lên đã hết hạn, chọn lại file".
  ATTACHMENT_TYPE_NOT_ALLOWED: 'ATTACHMENT_TYPE_NOT_ALLOWED',
  ATTACHMENT_TOO_LARGE: 'ATTACHMENT_TOO_LARGE',
  UPLOAD_TICKET_INVALID: 'UPLOAD_TICKET_INVALID',
  UPLOAD_INCOMPLETE: 'UPLOAD_INCOMPLETE',

  // Meetings. Bốn lý do khác nhau khiến một người không vào được phòng, và giao diện
  // phải phản ứng khác nhau với từng lý do: đếm ngược, hiện màn hình chờ duyệt, báo
  // buổi họp đã kết thúc, hay đưa về trang khoá học.
  MEETING_NOT_STARTED: 'MEETING_NOT_STARTED',
  MEETING_ENDED: 'MEETING_ENDED',
  MEETING_APPROVAL_PENDING: 'MEETING_APPROVAL_PENDING',
  MEETING_ACCESS_DENIED: 'MEETING_ACCESS_DENIED',
  /// Chỉ chủ phòng mới gia hạn, duyệt người vào, hay đóng phòng được.
  MEETING_NOT_HOST: 'MEETING_NOT_HOST',
  MEETING_TIME_INVALID: 'MEETING_TIME_INVALID',
  /// Bấm ghi hình lần thứ hai trong khi lần đầu còn đang chạy. Giao diện chỉ cần
  /// đồng bộ lại nút bấm, không phải báo lỗi cho người dùng.
  RECORDING_ALREADY_ACTIVE: 'RECORDING_ALREADY_ACTIVE',
  /// Bấm ghi hình khi chưa ai thực sự kết nối vào phòng trên SFU. Không phải sự cố:
  /// phòng chuyển LIVE trong database ngay lúc chủ phòng xin token, còn phòng bên
  /// LiveKit chỉ ra đời khi trình duyệt nối vào thật.
  RECORDING_ROOM_NOT_READY: 'RECORDING_ROOM_NOT_READY',

  // Bài kiểm tra đầu vào của lộ trình.
  ASSESSMENT_NO_QUESTIONS: 'ASSESSMENT_NO_QUESTIONS',
  ASSESSMENT_ALREADY_SUBMITTED: 'ASSESSMENT_ALREADY_SUBMITTED',
  ASSESSMENT_NOT_SUBMITTED: 'ASSESSMENT_NOT_SUBMITTED',

  // Raised by the database layer, see prisma-exception.filter.ts
  DB_UNIQUE_VIOLATION: 'DB_UNIQUE_VIOLATION',
  DB_RECORD_NOT_FOUND: 'DB_RECORD_NOT_FOUND',
  DB_FOREIGN_KEY_VIOLATION: 'DB_FOREIGN_KEY_VIOLATION',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export function defaultCodeForStatus(status: number): ErrorCodeValue {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ErrorCode.VALIDATION_FAILED;
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ErrorCode.CONFLICT;
    case HttpStatus.PAYLOAD_TOO_LARGE:
      return ErrorCode.PAYLOAD_TOO_LARGE;
    case HttpStatus.TOO_MANY_REQUESTS:
      return ErrorCode.RATE_LIMITED;
    case HttpStatus.SERVICE_UNAVAILABLE:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}
