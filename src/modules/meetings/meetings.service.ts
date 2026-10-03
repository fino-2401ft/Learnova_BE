import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  CourseStatus,
  MeetingParticipantRole,
  MeetingParticipantStatus,
  MeetingStatus,
  RecordingStatus,
  Role,
} from '@prisma/client';

import { ErrorCode } from '@/common/constants/error-codes';
import { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import { LivekitService } from './livekit.service';
import { MeetingGateway } from './meeting.gateway';
import { MeetingRow, MeetingsRepository } from './meetings.repository';
import {
  MAX_MEETING_MINUTES,
  MAX_SCHEDULE_AHEAD_DAYS,
  MIN_MEETING_MINUTES,
  CreateMeetingDto,
  ExtendMeetingDto,
  UpdateMeetingDto,
} from './dto/meeting.request';
import {
  MeetingAccessDto,
  MeetingDto,
  MeetingHistoryDto,
  MeetingParticipantDto,
  MeetingPendingDto,
  RecordingDto,
} from './dto/meeting.dto';
import { RecordingService } from './recording.service';

/** Trước giờ hẹn bao lâu thì cho phép vào phòng.
 *
 *  Không bắt đúng phút: người ta vào sớm để thử mic và camera, và một buổi học bắt đầu
 *  đúng giờ là buổi mà mọi người đã vào trước đó vài phút. */
const EARLY_JOIN_MINUTES = 15;

@Injectable()
export class MeetingsService {
  constructor(
    private readonly repo: MeetingsRepository,
    private readonly livekit: LivekitService,
    private readonly recording: RecordingService,

    @Inject(forwardRef(() => MeetingGateway))
    private readonly gateway: MeetingGateway,
  ) {}

  // -------------------------------------------------------------------------
  // Đặt lịch
  // -------------------------------------------------------------------------

  /**
   * Mentor đặt lịch một buổi họp cho khoá mình dạy.
   *
   * Phòng được tạo NGAY, ở trạng thái SCHEDULED — đó là điều làm cho buổi họp xuất
   * hiện trong lịch của cả lớp từ trước. Nó chỉ mở cửa khi tới giờ; xem `join`.
   */
  async createForCourse(
    courseId: string,
    dto: CreateMeetingDto,
    viewer: AuthenticatedUser,
  ): Promise<MeetingDto> {
    const course = await this.repo.findCourse(courseId);

    if (!course) throw new NotFoundException({ message: 'Course not found' });

    // Admin được tạo hộ để xử lý sự cố; ngoài ra chỉ mentor của chính khoá đó.
    if (course.mentorId !== viewer.userId && viewer.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Chỉ giảng viên của khoá học này mới đặt được lịch họp',
      });
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new ForbiddenException({
        code: ErrorCode.COURSE_NOT_PUBLISHED,
        message: 'Khoá học chưa xuất bản thì chưa có ai để họp cùng',
      });
    }

    const { start, end } = this.parseWindow(
      dto.scheduledStartAt,
      dto.scheduledEndAt,
    );

    const row = await this.repo.create({
      courseId,
      // Host là mentor của khoá, KHÔNG phải người bấm nút: khi admin tạo hộ, chủ
      // phòng vẫn phải là người sẽ đứng lớp, nếu không thì không ai duyệt được ai.
      hostId: course.mentorId,
      title: dto.title,
      description: dto.description ?? null,
      scheduledStartAt: start,
      scheduledEndAt: end,
    });

    return this.toDto(row, viewer, {
      myStatus: MeetingParticipantStatus.ADMITTED,
    });
  }

  async update(
    meetingRoomId: string,
    dto: UpdateMeetingDto,
    viewer: AuthenticatedUser,
  ): Promise<MeetingDto> {
    const row = await this.requireMeeting(meetingRoomId);
    this.assertHost(row, viewer);

    if (row.status === MeetingStatus.ENDED) {
      throw new BadRequestException({
        code: ErrorCode.MEETING_ENDED,
        message: 'Buổi họp đã kết thúc, không sửa lịch được nữa',
      });
    }

    // Chỉ kiểm tra lại khung giờ khi có ít nhất một mốc thay đổi. Sửa mỗi tiêu đề của
    // một buổi họp đã qua giờ hẹn thì không có lý do gì để bị chặn.
    const startInput = dto.scheduledStartAt;
    const endInput = dto.scheduledEndAt;
    const window =
      startInput || endInput
        ? this.parseWindow(
            startInput ?? row.scheduledStartAt.toISOString(),
            endInput ?? row.scheduledEndAt.toISOString(),
            // Buổi họp đang diễn ra có giờ bắt đầu nằm trong quá khứ — đó là bình
            // thường, nên không áp luật "phải ở tương lai" cho nó.
            { allowPastStart: row.status === MeetingStatus.LIVE },
          )
        : null;

    const updated = await this.repo.update(meetingRoomId, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(window
        ? { scheduledStartAt: window.start, scheduledEndAt: window.end }
        : {}),
    });

    return this.toDto(updated, viewer, {
      myStatus: MeetingParticipantStatus.ADMITTED,
    });
  }

  async cancel(
    meetingRoomId: string,
    viewer: AuthenticatedUser,
  ): Promise<void> {
    const row = await this.requireMeeting(meetingRoomId);
    this.assertHost(row, viewer);

    if (row.status === MeetingStatus.ENDED) return;

    await this.repo.update(meetingRoomId, {
      status: MeetingStatus.CANCELLED,
      actualEndAt: new Date(),
    });

    await this.livekit.closeRoom(row.meetingCode);
    this.gateway.notifyClosed(meetingRoomId, 'host');
  }

  // -------------------------------------------------------------------------
  // Danh sách
  // -------------------------------------------------------------------------

  async listMine(
    viewer: AuthenticatedUser,
    includeEnded: boolean,
  ): Promise<MeetingDto[]> {
    const rows = await this.repo.listForUser(viewer.userId, { includeEnded });
    return this.toDtoList(rows, viewer);
  }

  /**
   * Lịch họp của một khoá, hiện trên trang khoá học.
   *
   * CỐ Ý cho người NGOÀI khoá xem được, miễn là khoá đã xuất bản. Đó là điều kiện để
   * luồng "xin vào phòng" có ý nghĩa: không nhìn thấy buổi họp thì không ai bấm xin
   * vào được, và cơ chế duyệt của mentor thành ra vô dụng.
   *
   * Mức lộ thông tin ngang với chính trang khoá học — `GET /courses/:id` cũng mở cho
   * mọi tài khoản đã đăng nhập. Nói cách khác: xem được khoá thì xem được lịch họp
   * của khoá. Vào phòng thì lại là chuyện khác, và `join` mới là nơi quyết định.
   *
   * Khoá CHƯA xuất bản thì ngược lại — nó chưa dành cho ai ngoài giảng viên, nên lịch
   * họp của nó cũng vậy.
   */
  async listForCourse(
    courseId: string,
    viewer: AuthenticatedUser,
    includeEnded: boolean,
  ): Promise<MeetingDto[]> {
    const course = await this.repo.findCourse(courseId);

    if (!course) throw new NotFoundException({ message: 'Course not found' });

    if (
      course.status !== CourseStatus.PUBLISHED &&
      course.mentorId !== viewer.userId &&
      viewer.role !== Role.ADMIN
    ) {
      throw new ForbiddenException({
        code: ErrorCode.COURSE_NOT_PUBLISHED,
        message: 'Khoá học này chưa xuất bản',
      });
    }

    const rows = await this.repo.listForCourse(courseId, { includeEnded });
    return this.toDtoList(rows, viewer);
  }

  /**
   * Chi tiết một buổi họp.
   *
   * Endpoint duy nhất trong module này KHÔNG tự nói lên ai được đọc, nên phải kiểm
   * tra tường minh. Bỏ sót thì bất kỳ tài khoản nào biết `meetingRoomId` cũng đọc
   * được tiêu đề, mô tả, tên khoá học, tên giảng viên và số người tham gia của một
   * buổi họp họ không liên quan.
   */
  async detail(
    meetingRoomId: string,
    viewer: AuthenticatedUser,
  ): Promise<MeetingDto> {
    const row = await this.requireMeeting(meetingRoomId);
    const participant = await this.repo.findParticipant(
      meetingRoomId,
      viewer.userId,
    );

    await this.assertCanView(row, viewer, participant?.status ?? null);

    return this.toDto(row, viewer, { myStatus: participant?.status ?? null });
  }

  /**
   * Ai được đọc thông tin một buổi họp.
   *
   * Quy tắc: XEM ĐƯỢC KHOÁ THÌ XEM ĐƯỢC LỊCH HỌP CỦA KHOÁ. Buổi họp của một khoá đã
   * xuất bản mở cho mọi tài khoản đã đăng nhập, đúng bằng mức của trang khoá học —
   * và đó là điều kiện để người ngoài khoá biết mà bấm xin vào.
   *
   * Cố ý KHÔNG chặn người đã bị từ chối ở đây, dù đã từng cân nhắc: buổi họp vẫn hiện
   * trên trang khoá học mà ai cũng vào được, nên chặn riêng màn hình chi tiết chỉ tạo
   * ra một chỗ 403 khó hiểu chứ không giấu được gì. Lời từ chối vẫn có hiệu lực ở nơi
   * nó thực sự quan trọng — `join` chặn REJECTED trước mọi thứ khác.
   *
   * Hai trường hợp KHÔNG mở: buổi tư vấn 1-1 nằm ngoài mọi khoá học, và buổi họp của
   * khoá chưa xuất bản. Cả hai chỉ dành cho người đã có mặt trong danh sách.
   */
  private async assertCanView(
    row: MeetingRow,
    viewer: AuthenticatedUser,
    myStatus: MeetingParticipantStatus | null,
  ): Promise<void> {
    if (row.hostId === viewer.userId || viewer.role === Role.ADMIN) return;

    // Đã có tên trong danh sách phòng, dù ở trạng thái nào.
    if (myStatus !== null) return;

    if (row.courseId) {
      const course = await this.repo.findCourse(row.courseId);
      if (course?.status === CourseStatus.PUBLISHED) return;

      // Khoá bị gỡ xuất bản sau khi đã có người ghi danh: học viên cũ vẫn phải đọc
      // được lịch họp của khoá mình đang học.
      if (await this.repo.isCourseMember(row.courseId, viewer.userId)) return;
    }

    throw new ForbiddenException({
      code: ErrorCode.MEETING_ACCESS_DENIED,
      message: 'Bạn không có quyền xem buổi họp này',
    });
  }

  /** Danh sách người đang chờ duyệt. Chỉ chủ phòng đọc được — đây là màn hình
   *  "ai đang gõ cửa". */
  async listPending(
    meetingRoomId: string,
    viewer: AuthenticatedUser,
  ): Promise<MeetingParticipantDto[]> {
    const row = await this.requireMeeting(meetingRoomId);
    this.assertHost(row, viewer);

    const rows = await this.repo.listParticipants(
      meetingRoomId,
      MeetingParticipantStatus.PENDING,
    );

    return rows.map((p) => ({
      user: p.user,
      role: p.role,
      status: p.status,
      joinedAt: p.joinedAt,
      leftAt: p.leftAt,
    }));
  }

  // -------------------------------------------------------------------------
  // Vào phòng
  // -------------------------------------------------------------------------

  /**
   * Xin vào phòng. Trả về vé vào (token LiveKit) hoặc trạng thái đang chờ duyệt.
   *
   * Toàn bộ luật "ai được vào" nằm ở đây, và thứ tự các bước kiểm tra là có chủ ý:
   *
   *   1. Phòng có tồn tại và còn mở không — hỏi trước, vì một buổi đã kết thúc thì
   *      không cần biết người này là ai.
   *   2. Đã tới giờ chưa — trả `MEETING_NOT_STARTED` kèm giờ hẹn để giao diện đếm
   *      ngược, thay vì một chữ "cấm" không giải thích được.
   *   3. Người này là ai: chủ phòng → vào; thành viên khoá → vào; người ngoài → gõ cửa.
   *
   * Trả token là hành động KHÔNG THU HỒI ĐƯỢC: sau khi token rời server, LiveKit chỉ
   * đọc chữ ký chứ không hỏi lại hệ thống. Nên mọi kiểm tra phải xong trước dòng ký.
   */
  async join(
    meetingRoomId: string,
    viewer: AuthenticatedUser,
    displayName: string,
  ): Promise<MeetingAccessDto | MeetingPendingDto> {
    const row = await this.requireMeeting(meetingRoomId);

    if (
      row.status === MeetingStatus.ENDED ||
      row.status === MeetingStatus.CANCELLED
    ) {
      throw new BadRequestException({
        code: ErrorCode.MEETING_ENDED,
        message:
          row.status === MeetingStatus.CANCELLED
            ? 'Buổi họp đã bị huỷ'
            : 'Buổi họp đã kết thúc',
      });
    }

    const now = new Date();
    const opensAt = new Date(
      row.scheduledStartAt.getTime() - EARLY_JOIN_MINUTES * 60_000,
    );

    if (now < opensAt) {
      throw new BadRequestException({
        code: ErrorCode.MEETING_NOT_STARTED,
        message: `Phòng mở lúc ${row.scheduledStartAt.toISOString()}`,
      });
    }

    const isHost = row.hostId === viewer.userId;
    const existing = await this.repo.findParticipant(
      meetingRoomId,
      viewer.userId,
    );

    if (existing?.status === MeetingParticipantStatus.REJECTED) {
      throw new ForbiddenException({
        code: ErrorCode.MEETING_ACCESS_DENIED,
        message: 'Bạn không được vào buổi họp này',
      });
    }

    if (!isHost && existing?.status !== MeetingParticipantStatus.ADMITTED) {
      const isMember = row.courseId
        ? await this.repo.isCourseMember(row.courseId, viewer.userId)
        : false;

      // Người ngoài khoá: tạo (hoặc giữ nguyên) một dòng PENDING rồi báo chủ phòng.
      // Admin đi thẳng — họ vào để xử lý sự cố, không phải để dự lớp.
      if (!isMember && viewer.role !== Role.ADMIN) {
        if (!existing) {
          await this.repo.markJoined(
            meetingRoomId,
            viewer.userId,
            MeetingParticipantStatus.PENDING,
            MeetingParticipantRole.PARTICIPANT,
          );
        }

        this.gateway.notifyKnock(row.hostId, {
          meetingRoomId,
          user: {
            userId: viewer.userId,
            username: displayName,
            avatarUrl: null,
          },
        });

        return {
          status: MeetingParticipantStatus.PENDING,
          meeting: await this.toDto(row, viewer, {
            myStatus: MeetingParticipantStatus.PENDING,
          }),
        };
      }
    }

    // Từ đây trở xuống: người này được vào.
    //
    // Chủ phòng bấm vào là lúc buổi họp thật sự bắt đầu — đó là thời điểm ghi
    // `actualStartAt` và chuyển sang LIVE. Học viên vào trước không mở được phòng:
    // một buổi họp mà giảng viên chưa tới thì chưa bắt đầu.
    let current = row;

    if (isHost && row.status === MeetingStatus.SCHEDULED) {
      current = await this.repo.update(meetingRoomId, {
        status: MeetingStatus.LIVE,
        actualStartAt: now,
      });
    }

    await this.repo.markJoined(
      meetingRoomId,
      viewer.userId,
      MeetingParticipantStatus.ADMITTED,
      isHost ? MeetingParticipantRole.HOST : MeetingParticipantRole.PARTICIPANT,
    );

    const token = await this.livekit.createAccessToken({
      roomName: current.meetingCode,
      userId: viewer.userId,
      displayName,
      isHost,
    });

    return {
      serverUrl: this.livekit.url,
      token,
      roomName: current.meetingCode,
      meeting: await this.toDto(current, viewer, {
        myStatus: MeetingParticipantStatus.ADMITTED,
      }),
    };
  }

  async leave(meetingRoomId: string, viewer: AuthenticatedUser): Promise<void> {
    await this.repo.markLeft(meetingRoomId, viewer.userId);
  }

  // -------------------------------------------------------------------------
  // Duyệt người ngoài khoá
  // -------------------------------------------------------------------------

  async decide(
    meetingRoomId: string,
    targetUserId: string,
    admit: boolean,
    viewer: AuthenticatedUser,
  ): Promise<void> {
    const row = await this.requireMeeting(meetingRoomId);
    this.assertHost(row, viewer);

    const participant = await this.repo.findParticipant(
      meetingRoomId,
      targetUserId,
    );

    if (!participant) {
      throw new NotFoundException({ message: 'Người này chưa xin vào phòng' });
    }

    await this.repo.setStatus(
      meetingRoomId,
      targetUserId,
      admit
        ? MeetingParticipantStatus.ADMITTED
        : MeetingParticipantStatus.REJECTED,
    );

    // Từ chối một người ĐANG ở trong phòng thì phải đá họ ra thật. Đổi mỗi trạng thái
    // trong database không ngắt được kết nối đang mở với LiveKit — họ vẫn nghe và nói
    // bình thường trong khi hệ thống tưởng đã cấm.
    if (!admit) {
      await this.livekit.removeParticipant(row.meetingCode, targetUserId);
    }

    this.gateway.notifyDecision(targetUserId, admit, { meetingRoomId });
  }

  // -------------------------------------------------------------------------
  // Gia hạn và đóng phòng
  // -------------------------------------------------------------------------

  /**
   * Gia hạn: cộng thêm phút vào `scheduledEndAt`.
   *
   * Cộng từ mốc LỚN HƠN giữa "giờ hẹn cũ" và "bây giờ". Nếu luôn cộng vào giờ hẹn cũ,
   * một lần gia hạn bấm muộn ba phút sẽ chỉ kéo dài được bảy phút trong số mười phút
   * đã chọn — và tệ hơn, gia hạn sau khi đã quá giờ sẽ ra một mốc vẫn nằm trong quá
   * khứ, khiến job đóng phòng đóng ngay lập tức.
   */
  async extend(
    meetingRoomId: string,
    dto: ExtendMeetingDto,
    viewer: AuthenticatedUser,
  ): Promise<MeetingDto> {
    const row = await this.requireMeeting(meetingRoomId);
    this.assertHost(row, viewer);

    if (row.status !== MeetingStatus.LIVE) {
      throw new BadRequestException({
        code: ErrorCode.MEETING_ENDED,
        message: 'Chỉ gia hạn được buổi họp đang diễn ra',
      });
    }

    const now = Date.now();
    const base = Math.max(row.scheduledEndAt.getTime(), now);
    const scheduledEndAt = new Date(base + dto.minutes * 60_000);

    const updated = await this.repo.update(meetingRoomId, { scheduledEndAt });
    const meeting = await this.toDto(updated, viewer, {
      myStatus: MeetingParticipantStatus.ADMITTED,
    });

    this.gateway.notifyExtended(meetingRoomId, meeting);

    return meeting;
  }

  /** Chủ phòng chủ động đóng. Job hết giờ dùng `closeExpired` bên dưới. */
  async close(
    meetingRoomId: string,
    viewer: AuthenticatedUser,
  ): Promise<MeetingDto> {
    const row = await this.requireMeeting(meetingRoomId);
    this.assertHost(row, viewer);

    const updated = await this.finish(row, 'host');

    return this.toDto(updated, viewer, {
      myStatus: MeetingParticipantStatus.ADMITTED,
    });
  }

  /**
   * Đóng một phòng đã quá giờ. Gọi từ job định kỳ, không có `viewer`.
   *
   * Tách khỏi `close` vì không có ai để kiểm tra quyền — và một hàm nhận `viewer`
   * kiểu nullable sẽ mời gọi ai đó gọi nó với `null` từ một endpoint.
   */
  async closeExpired(row: MeetingRow): Promise<void> {
    await this.finish(row, 'timeout');
  }

  private async finish(
    row: MeetingRow,
    reason: 'host' | 'timeout',
  ): Promise<MeetingRow> {
    if (row.status === MeetingStatus.ENDED) return row;

    // Dừng ghi TRƯỚC khi đóng phòng. Ngược lại thì LiveKit huỷ phòng trước, tiến
    // trình ghi mất nguồn hình giữa chừng, và file thu được có thể hỏng hoặc mất đoạn
    // cuối — đúng đoạn mà giảng viên thường tổng kết buổi học.
    const active = await this.repo.findActiveRecording(row.meetingRoomId);

    if (active && active.status === RecordingStatus.RECORDING) {
      await this.recording.stop(active.egressId);
      await this.repo.updateRecordingByEgressId(active.egressId, {
        status: RecordingStatus.PROCESSING,
      });
    }

    const updated = await this.repo.update(row.meetingRoomId, {
      status: MeetingStatus.ENDED,
      actualEndAt: new Date(),
    });

    // Đá mọi người khỏi SFU. Không có bước này thì đánh dấu ENDED chỉ là ghi chú
    // trong database: cả phòng vẫn đang nói chuyện với nhau.
    await this.livekit.closeRoom(row.meetingCode);
    this.gateway.notifyClosed(row.meetingRoomId, reason);

    return updated;
  }

  // -------------------------------------------------------------------------
  // Ghi hình
  // -------------------------------------------------------------------------

  /**
   * Bắt đầu ghi. Chỉ chủ phòng, chỉ khi phòng đang LIVE.
   *
   * Chặn ghi chồng: một phòng chỉ có một bản ghi đang chạy tại một thời điểm. Không
   * chặn thì bấm hai lần ra hai file song song cùng nội dung, và cả hai đều bị tính
   * vào hạn mức của nhà cung cấp.
   */
  async startRecording(
    meetingRoomId: string,
    viewer: AuthenticatedUser,
  ): Promise<RecordingDto> {
    const row = await this.requireMeeting(meetingRoomId);
    this.assertHost(row, viewer);

    if (row.status !== MeetingStatus.LIVE) {
      throw new BadRequestException({
        code: ErrorCode.MEETING_ENDED,
        message: 'Chỉ ghi hình được buổi họp đang diễn ra',
      });
    }

    const active = await this.repo.findActiveRecording(meetingRoomId);

    if (active) {
      throw new BadRequestException({
        code: ErrorCode.RECORDING_ALREADY_ACTIVE,
        message: 'Buổi họp này đang được ghi hình',
      });
    }

    const started = await this.recording.start({
      roomName: row.meetingCode,
      courseId: row.courseId,
      meetingRoomId,
    });

    const created = await this.repo.createRecording({
      meetingRoomId,
      egressId: started.egressId,
      storageKey: started.storageKey,
      startedAt: started.startedAt,
    });

    const dto = this.toRecordingDto(created, true);
    this.gateway.notifyRecording(meetingRoomId, dto);

    return dto;
  }

  /** Dừng ghi. Trạng thái sau lệnh này là PROCESSING — LiveKit còn phải ghép và tải
   *  file lên, và job đối chiếu sẽ chuyển sang READY khi xong. */
  async stopRecording(
    meetingRoomId: string,
    viewer: AuthenticatedUser,
  ): Promise<RecordingDto | null> {
    const row = await this.requireMeeting(meetingRoomId);
    this.assertHost(row, viewer);

    const active = await this.repo.findActiveRecording(meetingRoomId);

    if (!active || active.status !== RecordingStatus.RECORDING) return null;

    await this.recording.stop(active.egressId);
    await this.repo.updateRecordingByEgressId(active.egressId, {
      status: RecordingStatus.PROCESSING,
    });

    const dto = this.toRecordingDto(
      { ...active, status: RecordingStatus.PROCESSING },
      true,
    );
    this.gateway.notifyRecording(meetingRoomId, dto);

    return dto;
  }

  /** Bản ghi của một buổi họp. Ai xem được buổi họp thì xem được danh sách này. */
  async listRecordings(
    meetingRoomId: string,
    viewer: AuthenticatedUser,
  ): Promise<RecordingDto[]> {
    const row = await this.requireMeeting(meetingRoomId);
    const participant = await this.repo.findParticipant(
      meetingRoomId,
      viewer.userId,
    );

    await this.assertCanView(row, viewer, participant?.status ?? null);
    await this.syncRecordings(row.meetingCode);

    const rows = await this.repo.listRecordings(meetingRoomId);
    const isHost = row.hostId === viewer.userId || viewer.role === Role.ADMIN;

    return rows.map((r) => this.toRecordingDto(r, isHost));
  }

  /**
   * Meeting History của một khoá: buổi đã kết thúc kèm bản ghi.
   *
   * Chặt hơn danh sách lịch họp một bậc, và đây là chủ ý: "khoá này có buổi họp lúc
   * 7h" là thông tin để người ngoài xin vào, còn bản ghi cả buổi học LÀ nội dung khoá
   * học. Người chưa ghi danh không xem lại được, giống như không đọc được bài giảng.
   */
  async courseHistory(
    courseId: string,
    viewer: AuthenticatedUser,
  ): Promise<MeetingHistoryDto[]> {
    const isMember = await this.repo.isCourseMember(courseId, viewer.userId);

    if (!isMember && viewer.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: ErrorCode.NOT_ENROLLED,
        message: 'Ghi danh khoá học này để xem lại các buổi đã học',
      });
    }

    const rows = await this.repo.listEndedWithRecordings(courseId);

    return Promise.all(
      rows.map(async (row) => ({
        meeting: await this.toDto(row, viewer),
        recordings: row.recordings.map((r) =>
          this.toRecordingDto(r, row.hostId === viewer.userId),
        ),
      })),
    );
  }

  /**
   * Hỏi LiveKit trạng thái thật của các bản ghi trong một phòng, rồi ghi lại.
   *
   * Gọi cả từ job định kỳ lẫn ngay trước khi liệt kê. Lý do phải hỏi thay vì chờ
   * webhook nằm ở recording.service.ts: lúc phát triển, backend ở localhost thì không
   * webhook nào tới được, và bản ghi kẹt ở PROCESSING mãi mãi.
   */
  async syncRecordings(roomName: string): Promise<void> {
    const snapshots = await this.recording.snapshot(roomName);

    for (const snap of snapshots) {
      await this.repo.updateRecordingByEgressId(snap.egressId, {
        status: snap.status,
        // Chỉ ghi đè khi có giá trị mới: một lần hỏi lỗi trả về null không được phép
        // xoá mất URL đã lấy được ở lần trước.
        ...(snap.url ? { url: snap.url } : {}),
        ...(snap.storageKey ? { storageKey: snap.storageKey } : {}),
        ...(snap.durationSec !== null ? { durationSec: snap.durationSec } : {}),
        ...(snap.sizeBytes !== null ? { sizeBytes: snap.sizeBytes } : {}),
        ...(snap.endedAt ? { endedAt: snap.endedAt } : {}),
        ...(snap.error ? { error: snap.error } : {}),
      });
    }
  }

  private toRecordingDto(
    row: {
      recordingId: string;
      status: RecordingStatus;
      url: string | null;
      durationSec: number | null;
      sizeBytes: bigint | null;
      startedAt: Date;
      endedAt: Date | null;
      error: string | null;
    },
    includeError: boolean,
  ): RecordingDto {
    return {
      recordingId: row.recordingId,
      status: row.status,
      url: row.url,
      durationSec: row.durationSec,
      // BigInt không đi qua JSON.stringify được — bỏ dòng này thì mọi response chứa
      // bản ghi sẽ ném "Do not know how to serialize a BigInt" ở tận tầng interceptor.
      sizeBytes: row.sizeBytes === null ? null : Number(row.sizeBytes),
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      error: includeError ? row.error : null,
    };
  }

  /** Lời nhắc "còn 10 phút", gửi riêng cho chủ phòng. Gọi từ job định kỳ. */
  notifyEndingSoon(row: MeetingRow, minutesLeft: number): void {
    this.gateway.notifyEndingSoon(row.hostId, {
      meetingRoomId: row.meetingRoomId,
      scheduledEndAt: row.scheduledEndAt.toISOString(),
      minutesLeft,
    });
  }

  // -------------------------------------------------------------------------
  // Dùng chung
  // -------------------------------------------------------------------------

  /** Gateway hỏi trước khi cho một socket vào kênh realtime của phòng. */
  async canAccessRealtime(
    meetingRoomId: string,
    viewer: AuthenticatedUser,
  ): Promise<boolean> {
    const row = await this.repo.findById(meetingRoomId);

    if (!row) return false;
    if (row.hostId === viewer.userId || viewer.role === Role.ADMIN) return true;

    const participant = await this.repo.findParticipant(
      meetingRoomId,
      viewer.userId,
    );

    if (participant?.status === MeetingParticipantStatus.ADMITTED) return true;
    if (participant?.status === MeetingParticipantStatus.REJECTED) return false;

    // Thành viên khoá học được vào kênh realtime ngay cả khi chưa bấm vào phòng —
    // đó là cách họ nhận được thông báo phòng đã mở.
    return row.courseId
      ? this.repo.isCourseMember(row.courseId, viewer.userId)
      : false;
  }

  private async requireMeeting(meetingRoomId: string): Promise<MeetingRow> {
    const row = await this.repo.findById(meetingRoomId);

    if (!row) throw new NotFoundException({ message: 'Meeting not found' });

    return row;
  }

  private assertHost(row: MeetingRow, viewer: AuthenticatedUser): void {
    if (row.hostId !== viewer.userId && viewer.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: ErrorCode.MEETING_NOT_HOST,
        message: 'Chỉ chủ phòng mới làm được việc này',
      });
    }
  }

  /**
   * Kiểm tra khung giờ đặt lịch.
   *
   * Bốn luật, mỗi luật chặn một cách hỏng khác nhau: giờ không hợp lệ, giờ ngược,
   * quá ngắn/quá dài, và đặt quá xa trong tương lai (thường là gõ nhầm năm).
   */
  private parseWindow(
    startInput: string,
    endInput: string,
    options: { allowPastStart?: boolean } = {},
  ): { start: Date; end: Date } {
    const start = new Date(startInput);
    const end = new Date(endInput);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException({
        code: ErrorCode.MEETING_TIME_INVALID,
        message: 'Thời gian không hợp lệ',
      });
    }

    const minutes = (end.getTime() - start.getTime()) / 60_000;

    if (minutes < MIN_MEETING_MINUTES) {
      throw new BadRequestException({
        code: ErrorCode.MEETING_TIME_INVALID,
        message: `Buổi họp phải kéo dài ít nhất ${MIN_MEETING_MINUTES} phút`,
      });
    }

    if (minutes > MAX_MEETING_MINUTES) {
      throw new BadRequestException({
        code: ErrorCode.MEETING_TIME_INVALID,
        message: `Buổi họp không được dài quá ${MAX_MEETING_MINUTES / 60} tiếng`,
      });
    }

    if (!options.allowPastStart && start.getTime() < Date.now() - 60_000) {
      throw new BadRequestException({
        code: ErrorCode.MEETING_TIME_INVALID,
        message: 'Không đặt lịch cho thời điểm đã qua',
      });
    }

    const maxAhead = Date.now() + MAX_SCHEDULE_AHEAD_DAYS * 86_400_000;

    if (start.getTime() > maxAhead) {
      throw new BadRequestException({
        code: ErrorCode.MEETING_TIME_INVALID,
        message: `Chỉ đặt lịch trước tối đa ${MAX_SCHEDULE_AHEAD_DAYS} ngày`,
      });
    }

    return { start, end };
  }

  private async toDtoList(
    rows: MeetingRow[],
    viewer: AuthenticatedUser,
  ): Promise<MeetingDto[]> {
    return Promise.all(rows.map((row) => this.toDto(row, viewer)));
  }

  private async toDto(
    row: MeetingRow,
    viewer: AuthenticatedUser,
    known: { myStatus?: MeetingParticipantStatus | null } = {},
  ): Promise<MeetingDto> {
    const isHost = row.hostId === viewer.userId;

    const myStatus =
      known.myStatus !== undefined
        ? known.myStatus
        : ((await this.repo.findParticipant(row.meetingRoomId, viewer.userId))
            ?.status ?? null);

    const admittedCount = await this.repo.countByStatus(
      row.meetingRoomId,
      MeetingParticipantStatus.ADMITTED,
    );

    // Chỉ đếm người chờ khi người xem là chủ phòng: học viên không có việc gì với con
    // số đó, và một truy vấn đếm cho mỗi hàng trong danh sách là lãng phí thật.
    const pendingCount = isHost
      ? await this.repo.countByStatus(
          row.meetingRoomId,
          MeetingParticipantStatus.PENDING,
        )
      : 0;

    return {
      meetingRoomId: row.meetingRoomId,
      courseId: row.courseId,
      courseTitle: row.course?.title ?? null,
      title: row.title,
      description: row.description,
      status: row.status,
      scheduledStartAt: row.scheduledStartAt,
      scheduledEndAt: row.scheduledEndAt,
      actualStartAt: row.actualStartAt,
      actualEndAt: row.actualEndAt,
      host: row.host,
      isHost,
      myStatus,
      admittedCount,
      pendingCount,
    };
  }
}
