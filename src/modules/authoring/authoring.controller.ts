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
  Put,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AuthoringService } from './authoring.service';
import {
  CreateChapterDto,
  CreateCourseDto,
  CreateLessonDto,
  ReorderDto,
  ReplaceLessonContentDto,
  UpdateChapterDto,
  UpdateCourseDto,
  UpdateLessonDto,
} from './dto/authoring.dto';

/**
 * Soạn thảo khoá học — dành riêng cho giảng viên.
 *
 * Tiền tố `/me/authoring` chứ không phải `/me` trần: `EnrollmentsController` đã
 * chiếm `/me` cho phía học viên, và `PUT /me/lessons/:id/progress` (học viên) đứng
 * cạnh `PATCH /me/lessons/:id` (giảng viên) là hai thứ rất dễ đọc nhầm thành một.
 *
 * Không endpoint nào nhận `mentorId` từ client — nó luôn đến từ access token.
 * Endpoint nhận mentorId sẽ cần kiểm tra quyền sở hữu ở mọi phương thức, và cái
 * đầu tiên quên kiểm là một lỗ hổng.
 *
 * Phần lớn endpoint trả về TOÀN BỘ cây khoá học sau khi ghi. Cố ý: một thao tác
 * soạn thảo thường kéo theo đánh số lại, nên trả bản đầy đủ giúp client không bao
 * giờ phải tự đoán trạng thái mới.
 */
@Controller('me/authoring')
@Roles(Role.MENTOR)
export class AuthoringController {
  constructor(private readonly authoring: AuthoringService) {}

  // --- khoá học ------------------------------------------------------------

  /** Khoá của tôi, MỌI trạng thái. Danh mục chung chỉ trả khoá đã xuất bản. */
  @Get('courses')
  listMine(@CurrentUser('userId') mentorId: string) {
    return this.authoring.listMine(mentorId);
  }

  @Get('courses/:courseId')
  getTree(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.getTree(courseId, mentorId);
  }

  @Post('courses')
  createCourse(
    @Body() dto: CreateCourseDto,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.createCourse(dto, mentorId);
  }

  @Patch('courses/:courseId')
  updateCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.updateCourse(courseId, dto, mentorId);
  }

  @Post('courses/:courseId/submit')
  @HttpCode(HttpStatus.OK)
  submit(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.submitCourse(courseId, mentorId);
  }

  @Delete('courses/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser('userId') mentorId: string,
  ): Promise<void> {
    return this.authoring.deleteCourse(courseId, mentorId);
  }

  /** Ai đang học khoá này và tới đâu. Chỉ chủ sở hữu khoá đọc được. */
  @Get('courses/:courseId/learners')
  listLearners(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.listLearners(courseId, mentorId);
  }

  // --- chương --------------------------------------------------------------

  @Post('courses/:courseId/chapters')
  createChapter(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateChapterDto,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.createChapter(courseId, dto, mentorId);
  }

  @Put('courses/:courseId/chapters/order')
  reorderChapters(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: ReorderDto,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.reorderChapters(courseId, dto, mentorId);
  }

  @Patch('chapters/:chapterId')
  updateChapter(
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
    @Body() dto: UpdateChapterDto,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.updateChapter(chapterId, dto, mentorId);
  }

  @Delete('chapters/:chapterId')
  deleteChapter(
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.deleteChapter(chapterId, mentorId);
  }

  // --- bài học -------------------------------------------------------------

  @Post('chapters/:chapterId/lessons')
  createLesson(
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
    @Body() dto: CreateLessonDto,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.createLesson(chapterId, dto, mentorId);
  }

  @Put('chapters/:chapterId/lessons/order')
  reorderLessons(
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
    @Body() dto: ReorderDto,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.reorderLessons(chapterId, dto, mentorId);
  }

  @Patch('lessons/:lessonId')
  updateLesson(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.updateLesson(lessonId, dto, mentorId);
  }

  @Delete('lessons/:lessonId')
  deleteLesson(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.deleteLesson(lessonId, mentorId);
  }

  // --- nội dung ------------------------------------------------------------

  /** Nội dung hiện tại để mở màn hình soạn. Ở đây `isCorrect` ĐƯỢC trả về. */
  @Get('lessons/:lessonId/content')
  getContent(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.getLessonContent(lessonId, mentorId);
  }

  /** Ghi đè toàn bộ mục nội dung và quiz của một bài. */
  @Put('lessons/:lessonId/content')
  replaceContent(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: ReplaceLessonContentDto,
    @CurrentUser('userId') mentorId: string,
  ) {
    return this.authoring.replaceContent(lessonId, dto, mentorId);
  }
}
