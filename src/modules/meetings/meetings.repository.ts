import { Injectable } from '@nestjs/common';
import {
  MeetingParticipantRole,
  MeetingParticipantStatus,
  MeetingStatus,
  Prisma,
  RecordingStatus,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';

import { PrismaService } from '@/database/prisma/prisma.service';

const USER_SELECT = {
  userId: true,
  username: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const MEETING_SELECT = {
  meetingRoomId: true,
  courseId: true,
  title: true,
  description: true,
  meetingCode: true,
  status: true,
  scheduledStartAt: true,
  scheduledEndAt: true,
  actualStartAt: true,
  actualEndAt: true,
  hostId: true,
  host: { select: USER_SELECT },
  course: { select: { title: true } },
} satisfies Prisma.MeetingRoomSelect;

export type MeetingRow = Prisma.MeetingRoomGetPayload<{
  select: typeof MEETING_SELECT;
}>;

/**
 * Mã phòng, cũng là tên phòng bên LiveKit.
 *
 * Ngẫu nhiên chứ không phải số tăng dần: mã này đi vào URL và vào tên phòng trên SFU,
 * nên mã đoán được nghĩa là đoán được phòng người khác. 10 ký tự base32 ≈ 50 bit, thừa
 * sức cho quy mô này.
 *
 * Bỏ các ký tự dễ đọc nhầm (0/O, 1/I/L) vì mã này người dùng có thể phải đọc cho nhau
 * qua điện thoại.
 */
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function generateMeetingCode(): string {
  const bytes = randomBytes(10);
  let code = '';

  for (const byte of bytes) {
    code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }

  return code;
}

@Injectable()
export class MeetingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(meetingRoomId: string): Promise<MeetingRow | null> {
    return this.prisma.meetingRoom.findUnique({
      where: { meetingRoomId },
      select: MEETING_SELECT,
    });
  }

  /**
   * Tạo phòng và dòng participant của chủ phòng trong CÙNG một transaction.
   *
   * Bất biến "mỗi phòng có đúng một HOST" (docs/class-diagram-v2.md) không có ràng
   * buộc database nào ép được, nên nó phải đúng ngay từ lúc sinh ra. Tách làm hai lệnh
   * nghĩa là một lỗi mạng giữa chừng để lại một phòng không có chủ — không ai duyệt
   * được ai vào, không ai đóng được nó.
   */
  create(data: {
    courseId: string | null;
    hostId: string;
    title: string;
    description: string | null;
    scheduledStartAt: Date;
    scheduledEndAt: Date;
  }): Promise<MeetingRow> {
    return this.prisma.$transaction(async (tx) => {
      const meeting = await tx.meetingRoom.create({
        data: {
          courseId: data.courseId,
          hostId: data.hostId,
          title: data.title,
          description: data.description,
          meetingCode: generateMeetingCode(),
          scheduledStartAt: data.scheduledStartAt,
          scheduledEndAt: data.scheduledEndAt,
          status: MeetingStatus.SCHEDULED,
        },
        select: MEETING_SELECT,
      });

      await tx.meetingParticipant.create({
        data: {
          meetingRoomId: meeting.meetingRoomId,
          userId: data.hostId,
          role: MeetingParticipantRole.HOST,
          status: MeetingParticipantStatus.ADMITTED,
        },
      });

      return meeting;
    });
  }

  update(
    meetingRoomId: string,
    data: Prisma.MeetingRoomUpdateInput,
  ): Promise<MeetingRow> {
    return this.prisma.meetingRoom.update({
      where: { meetingRoomId },
      data,
      select: MEETING_SELECT,
    });
  }

  /**
   * Buổi họp liên quan tới một người: phòng họ chủ trì, hoặc phòng của khoá họ tham gia.
   *
   * Viết bằng `OR` trên ba nhánh thay vì ba truy vấn rồi gộp ở JavaScript, để việc sắp
   * xếp và phân trang còn đúng.
   */
  listForUser(userId: string, options: { includeEnded: boolean }) {
    return this.prisma.meetingRoom.findMany({
      where: {
        ...(options.includeEnded
          ? {}
          : { status: { in: [MeetingStatus.SCHEDULED, MeetingStatus.LIVE] } }),
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
          // Thành viên khoá học thấy được phòng của khoá NGAY CẢ KHI chưa từng bấm
          // vào — nếu không thì lịch họp sắp tới không bao giờ hiện ra, và người ta
          // chỉ biết có buổi họp sau khi nó đã kết thúc.
          { course: { enrollments: { some: { menteeId: userId } } } },
          { course: { mentorId: userId } },
        ],
      },
      select: MEETING_SELECT,
      orderBy: [{ scheduledStartAt: 'asc' }, { meetingRoomId: 'asc' }],
    });
  }

  listForCourse(courseId: string, options: { includeEnded: boolean }) {
    return this.prisma.meetingRoom.findMany({
      where: {
        courseId,
        ...(options.includeEnded
          ? {}
          : { status: { in: [MeetingStatus.SCHEDULED, MeetingStatus.LIVE] } }),
      },
      select: MEETING_SELECT,
      orderBy: [{ scheduledStartAt: 'asc' }, { meetingRoomId: 'asc' }],
    });
  }

  findParticipant(meetingRoomId: string, userId: string) {
    return this.prisma.meetingParticipant.findUnique({
      where: { meetingRoomId_userId: { meetingRoomId, userId } },
      select: { role: true, status: true, joinedAt: true, leftAt: true },
    });
  }

  listParticipants(meetingRoomId: string, status?: MeetingParticipantStatus) {
    return this.prisma.meetingParticipant.findMany({
      where: { meetingRoomId, ...(status ? { status } : {}) },
      select: {
        role: true,
        status: true,
        joinedAt: true,
        leftAt: true,
        user: { select: USER_SELECT },
      },
      orderBy: { invitedAt: 'asc' },
    });
  }

  countByStatus(
    meetingRoomId: string,
    status: MeetingParticipantStatus,
  ): Promise<number> {
    return this.prisma.meetingParticipant.count({
      where: { meetingRoomId, status },
    });
  }

  /**
   * Ghi nhận một người vào phòng.
   *
   * `upsert` chứ không phải `create`: vào lại phòng sau khi rớt mạng là chuyện thường,
   * và lần thứ hai không được phép trả về lỗi trùng khoá.
   *
   * Nhánh `update` KHÔNG đụng tới `status`. Đây là điểm dễ sai nhất trong cả file:
   * ghi đè status ở đây sẽ biến một người đang PENDING — hoặc đã bị REJECTED — thành
   * ADMITTED chỉ vì họ bấm nút vào phòng lần nữa. Quyền vào phòng chỉ đổi qua
   * `setStatus`, do chủ phòng gọi.
   */
  markJoined(
    meetingRoomId: string,
    userId: string,
    status: MeetingParticipantStatus,
    role: MeetingParticipantRole,
  ) {
    return this.prisma.meetingParticipant.upsert({
      where: { meetingRoomId_userId: { meetingRoomId, userId } },
      create: { meetingRoomId, userId, status, role },
      update: { joinedAt: new Date(), leftAt: null },
    });
  }

  setStatus(
    meetingRoomId: string,
    userId: string,
    status: MeetingParticipantStatus,
  ) {
    return this.prisma.meetingParticipant.update({
      where: { meetingRoomId_userId: { meetingRoomId, userId } },
      data: { status },
    });
  }

  markLeft(meetingRoomId: string, userId: string) {
    return this.prisma.meetingParticipant.updateMany({
      where: { meetingRoomId, userId },
      data: { leftAt: new Date() },
    });
  }

  /** Người đó có thuộc khoá học không — mentor dạy khoá, hoặc mentee đã ghi danh.
   *  Đây là câu hỏi quyết định vào thẳng hay phải chờ duyệt. */
  async isCourseMember(courseId: string, userId: string): Promise<boolean> {
    const course = await this.prisma.course.findFirst({
      where: {
        courseId,
        OR: [
          { mentorId: userId },
          { enrollments: { some: { menteeId: userId } } },
        ],
      },
      select: { courseId: true },
    });

    return course !== null;
  }

  findCourse(courseId: string) {
    return this.prisma.course.findUnique({
      where: { courseId },
      select: { courseId: true, title: true, status: true, mentorId: true },
    });
  }

  /**
   * Phòng đang LIVE mà đã quá giờ hẹn — đầu vào của job tự đóng phòng.
   *
   * Index `(status, scheduledEndAt)` trong schema tồn tại đúng vì truy vấn này, chạy
   * mỗi phút.
   */
  findOverdue(now: Date): Promise<MeetingRow[]> {
    return this.prisma.meetingRoom.findMany({
      where: { status: MeetingStatus.LIVE, scheduledEndAt: { lt: now } },
      select: MEETING_SELECT,
    });
  }

  // --- Ghi hình -----------------------------------------------------------

  createRecording(data: {
    meetingRoomId: string;
    egressId: string;
    storageKey: string;
    startedAt: Date;
  }) {
    return this.prisma.meetingRecording.create({ data });
  }

  listRecordings(meetingRoomId: string) {
    return this.prisma.meetingRecording.findMany({
      where: { meetingRoomId },
      orderBy: { startedAt: 'asc' },
    });
  }

  /** Bản ghi đang chạy của một phòng. Dùng để chặn bấm ghi hai lần, và để biết phải
   *  dừng cái nào khi đóng phòng. */
  findActiveRecording(meetingRoomId: string) {
    return this.prisma.meetingRecording.findFirst({
      where: {
        meetingRoomId,
        status: {
          in: [RecordingStatus.RECORDING, RecordingStatus.PROCESSING],
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  /** Mọi bản ghi chưa tới trạng thái chung cuộc — đầu vào của job đối chiếu. */
  findUnsettledRecordings() {
    return this.prisma.meetingRecording.findMany({
      where: {
        status: {
          in: [RecordingStatus.RECORDING, RecordingStatus.PROCESSING],
        },
      },
      select: {
        recordingId: true,
        egressId: true,
        meetingRoomId: true,
        meetingRoom: { select: { meetingCode: true } },
      },
    });
  }

  updateRecordingByEgressId(
    egressId: string,
    data: Prisma.MeetingRecordingUpdateInput,
  ) {
    // `updateMany` chứ không phải `update`: một egress có thể thuộc về phòng đã bị
    // xoá, và khi đó `update` ném lỗi còn `updateMany` lặng lẽ không đụng hàng nào —
    // đúng thứ mình muốn trong một job chạy nền.
    return this.prisma.meetingRecording.updateMany({
      where: { egressId },
      data,
    });
  }

  /**
   * Buổi họp đã qua của một khoá, kèm bản ghi — dữ liệu của Meeting History.
   *
   * Buổi bị HUỶ chỉ hiện khi nó có bản ghi. Buổi huỷ mà không ghi được gì là buổi
   * KHÔNG diễn ra, và xếp nó vào "buổi học đã qua" chỉ làm người học phải lướt qua
   * những dòng không có gì để xem. Vẫn giữ nhánh huỷ-có-bản-ghi vì chủ phòng có thể
   * ghi hình rồi mới huỷ, và khi đó bản ghi là thật.
   */
  listEndedWithRecordings(courseId: string) {
    return this.prisma.meetingRoom.findMany({
      where: {
        courseId,
        status: { in: [MeetingStatus.ENDED, MeetingStatus.CANCELLED] },
        OR: [{ status: MeetingStatus.ENDED }, { recordings: { some: {} } }],
      },
      select: {
        ...MEETING_SELECT,
        recordings: { orderBy: { startedAt: 'asc' } },
      },
      // Mới nhất trước: buổi vừa học xong là buổi người ta tìm xem lại nhiều nhất.
      orderBy: [{ scheduledStartAt: 'desc' }, { meetingRoomId: 'desc' }],
    });
  }

  /**
   * Phòng LIVE sắp hết giờ trong khoảng [from, to) — đầu vào của lời nhắc gia hạn.
   *
   * Khoảng mở-đóng chứ không phải "còn đúng 10 phút": job chạy mỗi phút và không bao
   * giờ chạy đúng vào giây thứ 0, nên so bằng sẽ trượt và lời nhắc không bao giờ bắn.
   */
  findEndingSoon(from: Date, to: Date): Promise<MeetingRow[]> {
    return this.prisma.meetingRoom.findMany({
      where: {
        status: MeetingStatus.LIVE,
        scheduledEndAt: { gte: from, lt: to },
      },
      select: MEETING_SELECT,
    });
  }
}
