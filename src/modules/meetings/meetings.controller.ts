import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UsersService } from '@/modules/users/users.service';
import {
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
import { MeetingsService } from './meetings.service';

import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';

/** `?includeEnded=true` mới trả về buổi đã kết thúc. Mặc định là không: màn hình
 *  thường dùng nhất là "sắp tới và đang diễn ra", và lẫn lịch sử vào đó thì buổi họp
 *  hôm nay bị đẩy xuống dưới hàng chục buổi đã qua. */
function wantsEnded(value?: string): boolean {
  return value === 'true';
}

@Controller()
export class MeetingsController {
  constructor(
    private readonly meetings: MeetingsService,
    private readonly users: UsersService,
  ) {}

  // --- Đặt lịch -----------------------------------------------------------

  @Post('courses/:courseId/meetings')
  createForCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateMeetingDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<MeetingDto> {
    return this.meetings.createForCourse(courseId, dto, viewer);
  }

  @Patch('meetings/:meetingRoomId')
  update(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @Body() dto: UpdateMeetingDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<MeetingDto> {
    return this.meetings.update(meetingRoomId, dto, viewer);
  }

  /** Huỷ một buổi chưa diễn ra. Buổi đang diễn ra thì dùng `/close`. */
  @Delete('meetings/:meetingRoomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<void> {
    return this.meetings.cancel(meetingRoomId, viewer);
  }

  // --- Danh sách ----------------------------------------------------------

  @Get('me/meetings')
  listMine(
    @CurrentUser() viewer: AuthenticatedUser,
    @Query('includeEnded') includeEnded?: string,
  ): Promise<MeetingDto[]> {
    return this.meetings.listMine(viewer, wantsEnded(includeEnded));
  }

  @Get('courses/:courseId/meetings')
  listForCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() viewer: AuthenticatedUser,
    @Query('includeEnded') includeEnded?: string,
  ): Promise<MeetingDto[]> {
    return this.meetings.listForCourse(
      courseId,
      viewer,
      wantsEnded(includeEnded),
    );
  }

  @Get('meetings/:meetingRoomId')
  detail(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<MeetingDto> {
    return this.meetings.detail(meetingRoomId, viewer);
  }

  /** Ai đang gõ cửa. Chỉ chủ phòng đọc được. */
  @Get('meetings/:meetingRoomId/pending')
  listPending(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<MeetingParticipantDto[]> {
    return this.meetings.listPending(meetingRoomId, viewer);
  }

  // --- Vào phòng ----------------------------------------------------------

  /**
   * Xin vào phòng. Trả về vé vào (token LiveKit), hoặc trạng thái đang chờ duyệt.
   *
   * `@HttpCode(OK)` vì phần lớn lời gọi không tạo ra gì mới — vào lại phòng sau khi
   * rớt mạng là đường đi thường gặp nhất, và client không thể biết trước để phân biệt
   * 200 với 201.
   *
   * Siết chặt hơn mức chung: mỗi lời gọi ký một token và có thể chạm tới LiveKit, nên
   * đây là endpoint đắt nhất của module.
   */
  @Post('meetings/:meetingRoomId/join')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async join(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<MeetingAccessDto | MeetingPendingDto> {
    // Tên hiển thị đọc từ database chứ không nhận từ client: nó được đóng dấu vào
    // token LiveKit và hiện dưới ô video của người đó cho cả phòng thấy. Để client tự
    // khai nghĩa là ai cũng vào họp dưới tên người khác được.
    const profile = await this.users.findById(viewer.userId);

    return this.meetings.join(
      meetingRoomId,
      viewer,
      profile?.username ?? 'Người dùng',
    );
  }

  @Post('meetings/:meetingRoomId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  leave(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<void> {
    return this.meetings.leave(meetingRoomId, viewer);
  }

  // --- Duyệt người ngoài khoá ---------------------------------------------

  @Post('meetings/:meetingRoomId/participants/:userId/admit')
  @HttpCode(HttpStatus.NO_CONTENT)
  admit(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<void> {
    return this.meetings.decide(meetingRoomId, userId, true, viewer);
  }

  @Post('meetings/:meetingRoomId/participants/:userId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  reject(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<void> {
    return this.meetings.decide(meetingRoomId, userId, false, viewer);
  }

  // --- Gia hạn và đóng phòng ----------------------------------------------

  @Patch('meetings/:meetingRoomId/extend')
  extend(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @Body() dto: ExtendMeetingDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<MeetingDto> {
    return this.meetings.extend(meetingRoomId, dto, viewer);
  }

  @Post('meetings/:meetingRoomId/close')
  @HttpCode(HttpStatus.OK)
  close(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<MeetingDto> {
    return this.meetings.close(meetingRoomId, viewer);
  }

  // --- Ghi hình -----------------------------------------------------------

  /** Bắt đầu ghi. Siết chặt: mỗi lời gọi khởi động một tiến trình ghi trên hạ tầng
   *  của nhà cung cấp, và đó là thứ tính tiền. */
  @Post('meetings/:meetingRoomId/recording/start')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  startRecording(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<RecordingDto> {
    return this.meetings.startRecording(meetingRoomId, viewer);
  }

  /** Dừng ghi. Trả `null` khi không có bản ghi nào đang chạy — dừng một thứ đã dừng
   *  là không-làm-gì, không phải lỗi. */
  @Post('meetings/:meetingRoomId/recording/stop')
  @HttpCode(HttpStatus.OK)
  stopRecording(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<RecordingDto | null> {
    return this.meetings.stopRecording(meetingRoomId, viewer);
  }

  @Get('meetings/:meetingRoomId/recordings')
  listRecordings(
    @Param('meetingRoomId', ParseUUIDPipe) meetingRoomId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<RecordingDto[]> {
    return this.meetings.listRecordings(meetingRoomId, viewer);
  }

  /**
   * Meeting History của một khoá học: các buổi đã kết thúc kèm bản ghi.
   *
   * Chặt hơn `GET /courses/:id/meetings` một bậc — lịch họp mở cho cả người ngoài để
   * họ xin vào, còn bản ghi cả buổi học LÀ nội dung khoá học nên chỉ người đã ghi
   * danh mới xem lại được.
   */
  @Get('courses/:courseId/meeting-history')
  courseHistory(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<MeetingHistoryDto[]> {
    return this.meetings.courseHistory(courseId, viewer);
  }
}
