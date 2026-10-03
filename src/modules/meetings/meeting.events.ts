/**
 * Sự kiện realtime của phòng họp.
 *
 * Gateway RIÊNG, không dùng chung với chat messenger. Đây là quyết định đã chốt trong
 * docs/class-diagram-v2.md và lý do rất cụ thể: chat messenger nhận tin → ghi database
 * → rồi mới phát; chat phòng họp chỉ phát lại cho phòng và không chạm database. Gộp
 * hai luồng vào một gateway thì sớm muộn sẽ có người thêm một lệnh ghi vào nhánh sai,
 * và tin nhắn trong buổi họp bắt đầu nằm lại trong bảng `messages` mãi mãi.
 */
export const MeetingEvent = {
  /** Client xin vào kênh realtime của một phòng. Không phải là vào phòng họp —
   *  việc đó qua REST và LiveKit; đây chỉ là kênh phụ cho chat và thông báo. */
  JOIN: 'meeting:join',
  LEAVE: 'meeting:leave',

  /** Chat trong phòng. Phát rồi thôi, KHÔNG ghi database. */
  MESSAGE: 'meeting:message',

  /** Có người ngoài khoá gõ cửa. Chỉ gửi tới chủ phòng. */
  KNOCK: 'meeting:knock',
  /** Chủ phòng đã trả lời. Gửi tới đúng người xin vào, ở mọi thiết bị của họ. */
  ADMITTED: 'meeting:admitted',
  REJECTED: 'meeting:rejected',

  /** Còn 10 phút là hết giờ hẹn. Chỉ gửi tới chủ phòng, kèm nút gia hạn. */
  ENDING_SOON: 'meeting:ending-soon',
  /** Chủ phòng vừa gia hạn — cả phòng cập nhật lại đồng hồ đếm ngược. */
  EXTENDED: 'meeting:extended',
  /** Phòng đã đóng, dù do chủ phòng bấm hay do hết giờ. Cả phòng rời đi. */
  CLOSED: 'meeting:closed',

  /** Trạng thái ghi hình vừa đổi. Gửi cho CẢ phòng, không riêng chủ phòng: mọi người
   *  có quyền biết buổi học đang được ghi lại. */
  RECORDING: 'meeting:recording',
} as const;

/** Phòng Socket.IO chứa mọi người đang mở một buổi họp. */
export const meetingRoom = (meetingRoomId: string): string =>
  `meeting:${meetingRoomId}`;

/** Mọi thiết bị của một người. Dùng cho thông báo cá nhân: được duyệt, bị từ chối,
 *  và lời nhắc gia hạn gửi riêng cho chủ phòng. */
export const meetingUserRoom = (userId: string): string =>
  `meeting-user:${userId}`;

/** Tin nhắn chat trong phòng. Không có `messageId` vì không có gì để tham chiếu tới:
 *  nó không được lưu, không sửa được, không thu hồi được. */
export interface MeetingChatMessage {
  meetingRoomId: string;
  sender: { userId: string; username: string; avatarUrl: string | null };
  content: string;
  /** Do server đóng dấu, không lấy từ client — đồng hồ máy người dùng có thể sai
   *  hàng giờ, và một tin nhắn hiện ở sai vị trí trong dòng thời gian thì khó hiểu
   *  hơn hẳn một tin nhắn đến muộn. */
  sentAt: string;
}
