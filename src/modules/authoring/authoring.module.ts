import { Module } from '@nestjs/common';

import { AuthoringController } from './authoring.controller';
import { AuthoringRepository } from './authoring.repository';
import { AuthoringService } from './authoring.service';

/**
 * Soạn thảo khoá học: tạo, sửa, sắp thứ tự, nộp duyệt.
 *
 * Tách khỏi `CoursesModule` vì hai bên có luật khác hẳn nhau. Module kia phục vụ
 * người ĐỌC khoá học và chỉ quan tâm khoá đã xuất bản; module này phục vụ người
 * VIẾT và làm việc chủ yếu với khoá chưa xuất bản. Gộp chung thì mỗi truy vấn đều
 * phải mang theo một nhánh "đang đọc hay đang viết".
 */
@Module({
  controllers: [AuthoringController],
  providers: [AuthoringService, AuthoringRepository],
})
export class AuthoringModule {}
