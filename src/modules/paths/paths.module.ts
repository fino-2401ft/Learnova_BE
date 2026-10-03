import { Module } from '@nestjs/common';

import { AssessmentRepository } from './assessment.repository';
import { AssessmentService } from './assessment.service';
import { PathsController } from './paths.controller';
import { PathsRepository } from './paths.repository';
import { PathsService } from './paths.service';

/**
 * Lộ trình nghề.
 *
 * Tách khỏi CoursesModule dù cùng đọc bảng `courses`: lộ trình là một khái niệm riêng
 * với vòng đời riêng — đợt sau nó sẽ mang thêm bài test đầu vào và phần cá nhân hoá
 * theo điểm kỹ năng, những thứ không liên quan gì tới việc duyệt danh mục khoá học.
 */
@Module({
  controllers: [PathsController],
  providers: [
    PathsService,
    PathsRepository,
    AssessmentService,
    AssessmentRepository,
  ],
  exports: [PathsService, AssessmentService],
})
export class PathsModule {}
