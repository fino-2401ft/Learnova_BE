import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AssessmentService } from './assessment.service';
import {
  AssessmentDto,
  AssessmentResultDto,
  SubmitAssessmentDto,
} from './dto/assessment.dto';
import { LearningPathDetailDto, LearningPathSummaryDto } from './dto/path.dto';
import { PathsService } from './paths.service';

import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';

/**
 * Lộ trình nghề: "NodeJS Backend Developer", "React Frontend Developer".
 *
 * Không `@Public()`: JwtAuthGuard toàn cục vẫn áp dụng, nên request ẩn danh nhận 401.
 * Cần người dùng đã đăng nhập vì mỗi thẻ lộ trình hiện luôn số khoá người đó đã ghi
 * danh — "đang học 3/7" chỉ có nghĩa khi biết đang nói về ai.
 *
 * Không gắn `@Roles`: mọi vai trò đều xem được lộ trình. Giảng viên cũng cần nhìn thấy
 * khoá của mình nằm ở bước nào.
 */
@Controller('paths')
export class PathsController {
  constructor(
    private readonly paths: PathsService,
    private readonly assessments: AssessmentService,
  ) {}

  @Get()
  list(
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<LearningPathSummaryDto[]> {
    return this.paths.list(viewer);
  }

  /**
   * Chi tiết một lộ trình, kèm danh sách khoá theo đúng thứ tự học.
   *
   * Tra theo `slug` chứ không theo UUID: slug đi vào URL mà người dùng nhìn thấy và
   * chia sẻ được (`/lo-trinh/react-frontend`), còn UUID thì không nói lên gì.
   */
  @Get(':slug')
  detail(
    @Param('slug') slug: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<LearningPathDetailDto> {
    return this.paths.detail(slug, viewer);
  }

  // --- Bài kiểm tra đầu vào ------------------------------------------------

  /**
   * Bắt đầu bài kiểm tra, hoặc lấy lại bài đang làm dở.
   *
   * `@HttpCode(OK)` vì phần lớn lời gọi KHÔNG tạo gì mới: mở lại tab là lấy lại đúng
   * bộ đề cũ. Client không biết trước để phân biệt 200 với 201.
   *
   * Siết chặt: mỗi lời gọi có thể tạo một bài mới cùng vài chục dòng câu hỏi.
   */
  @Post(':slug/assessment')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  startAssessment(
    @Param('slug') slug: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<AssessmentDto> {
    return this.assessments.start(slug, viewer);
  }

  /** Bộ đề đang làm dở. Tải lại trang không được mất câu đã trả lời. */
  @Get('assessments/:assessmentId')
  getAssessment(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<AssessmentDto> {
    return this.assessments.current(assessmentId, viewer);
  }

  /** Nộp bài. Chấm ở server — client chỉ gửi lên lựa chọn đã chọn. */
  @Post('assessments/:assessmentId/submit')
  @HttpCode(HttpStatus.OK)
  submitAssessment(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Body() dto: SubmitAssessmentDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<AssessmentResultDto> {
    return this.assessments.submit(assessmentId, dto, viewer);
  }

  /** Xem lại kết quả một bài đã nộp. */
  @Get('assessments/:assessmentId/result')
  assessmentResult(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<AssessmentResultDto> {
    return this.assessments.result(assessmentId, viewer);
  }
}
