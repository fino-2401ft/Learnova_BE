import { Module } from '@nestjs/common';

import { CoursesController } from './courses.controller';
import { CoursesRepository } from './courses.repository';
import { CoursesService } from './courses.service';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsRepository } from './enrollments.repository';
import { EnrollmentsService } from './enrollments.service';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

/**
 * Reading and consuming courses: browse, enrol, learn, track progress, take quizzes.
 *
 * Authoring is not here. Creating and approving courses is a different workflow with
 * a different audience (mentor, admin) and its own status machine; today that content
 * arrives through the Markdown importer under prisma/import.
 */
@Module({
  controllers: [CoursesController, LessonsController, EnrollmentsController],
  providers: [
    CoursesService,
    LessonsService,
    EnrollmentsService,
    CoursesRepository,
    EnrollmentsRepository,
  ],
  exports: [CoursesService, EnrollmentsService],
})
export class CoursesModule {}
